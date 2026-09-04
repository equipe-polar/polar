import { badRequest, conflict, forbidden, notFound } from "../../shared/errors/app-error.js";
import {
  PapelUsuario,
  PrioridadeOcorrencia,
  StatusOcorrencia,
  TipoEnsino,
  type DestinatarioNotificacao,
  type NotificacaoOcorrencia,
  type Ocorrencia,
  type OcorrenciaHistorico
} from "../../shared/domain.js";
import type { AlunoRepository } from "../../shared/database/repositories/aluno.repository.js";
import type { TurmaRepository } from "../../shared/database/repositories/turma.repository.js";
import type { OcorrenciaRepository } from "../../shared/database/repositories/ocorrencia.repository.js";
import type { NotificacaoOcorrenciaRepository } from "../../shared/database/repositories/notificacao-ocorrencia.repository.js";
import type { AuditRepository } from "../../shared/database/repositories/audit.repository.js";
import { agoraIso, novoId } from "../../shared/utils/ids.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";

const proximoStatus: Record<StatusOcorrencia, StatusOcorrencia | null> = {
  [StatusOcorrencia.REGISTRADA]: StatusOcorrencia.EM_ANALISE,
  [StatusOcorrencia.EM_ANALISE]: StatusOcorrencia.RESOLVIDA,
  [StatusOcorrencia.RESOLVIDA]: StatusOcorrencia.ENCERRADA,
  [StatusOcorrencia.ENCERRADA]: null
};

export interface OcorrenciaCreateInput {
  alunoId: string;
  categoria: string;
  prioridade: PrioridadeOcorrencia;
  descricao: string;
  local?: string | undefined;
  testemunhas?: string | undefined;
  bimestre: number;
}

export interface OcorrenciaUpdateInput {
  categoria?: string | undefined;
  prioridade?: PrioridadeOcorrencia | undefined;
  descricao?: string | undefined;
  local?: string | undefined;
  testemunhas?: string | undefined;
}

/**
 * Escopo de leitura de ocorrencias por papel. Decisao unica, reusada pela listagem,
 * pelo acesso direto por id e pelo dashboard.
 *
 * - `global`: coordenacao, direcao e ADM leem a escola inteira.
 * - `autor`:  professor le apenas o que ele mesmo registrou.
 * - `nenhum`: nega por padrao. O ALUNO cai aqui porque o modelo ainda nao vincula
 *   Usuario a Aluno; enquanto esse vinculo nao existir, ele nao pode ler ocorrencia
 *   nenhuma. Qualquer papel novo tambem cai aqui ate ser decidido explicitamente.
 */
export type EscopoOcorrencias = { tipo: "global" } | { tipo: "autor"; usuarioId: string } | { tipo: "nenhum" };

export function escopoDeOcorrencias(actor: AuthenticatedUser): EscopoOcorrencias {
  switch (actor.papel) {
    case PapelUsuario.COORDENADOR:
    case PapelUsuario.DIRETOR:
    case PapelUsuario.ADM:
      return { tipo: "global" };
    case PapelUsuario.PROFESSOR:
      return { tipo: "autor", usuarioId: actor.id };
    default:
      return { tipo: "nenhum" };
  }
}

export class OcorrenciasService {
  constructor(
    private readonly ocorrencias: OcorrenciaRepository,
    private readonly alunos: AlunoRepository,
    private readonly turmas: TurmaRepository,
    private readonly notificacoes: NotificacaoOcorrenciaRepository,
    private readonly audit: AuditRepository
  ) {}

  async list(actor: AuthenticatedUser, bimestre?: Number): Promise<Ocorrencia[]> {
    const escopo = escopoDeOcorrencias(actor);
    switch (escopo.tipo) {
      case "global":
        return this.ocorrencias.list();
      case "autor":
        return this.ocorrencias.listByCriadoPor(escopo.usuarioId);
      default:
        return [];
    }
  }

  async get(id: string, actor: AuthenticatedUser): Promise<Ocorrencia> {
    const ocorrencia = await this.ocorrencias.findById(id);
    if (!ocorrencia) {
      throw notFound("Ocorrencia nao encontrada.");
    }
    const escopo = escopoDeOcorrencias(actor);
    if (escopo.tipo === "nenhum") {
      throw forbidden("Papel sem permissao de leitura de ocorrencias.");
    }
    if (escopo.tipo === "autor" && ocorrencia.criadoPorId !== escopo.usuarioId) {
      throw forbidden("Professor consulta apenas as ocorrencias registradas por ele.");
    }
    return ocorrencia;
  }

  async historico(id: string, actor: AuthenticatedUser): Promise<OcorrenciaHistorico[]> {
    await this.get(id, actor);
    return this.ocorrencias.listHistorico(id);
  }

  async notificacoesDaOcorrencia(id: string, actor: AuthenticatedUser): Promise<NotificacaoOcorrencia[]> {
    await this.get(id, actor);
    return this.notificacoes.listByOcorrencia(id);
  }

  async create(input: OcorrenciaCreateInput, actor: AuthenticatedUser): Promise<Ocorrencia> {
    const { alunoId, categoria, descricao, prioridade } = input;

    if (!alunoId || !categoria || !descricao) {
      throw badRequest("Ocorrencia exige aluno, categoria, prioridade e descricao.");
    }

    const aluno = await this.alunos.findById(alunoId);
    if (!aluno || !aluno.ativo) {
      throw badRequest("Ocorrencia deve estar vinculada a aluno valido.");
    }

    const turma = await this.turmas.findById(aluno.turmaId);
    if (!turma) {
      throw badRequest("Turma do aluno nao encontrada.");
    }

    const duplicate = await this.ocorrencias.findDuplicate({
      alunoId,
      categoria,
      descricao,
      criadoPorId: actor.id,
      desde: new Date(Date.now() - 5 * 60 * 1000)
    });
    if (duplicate) {
      throw conflict("Ocorrencia duplicada detectada em janela curta.");
    }

    const now = agoraIso();
    const ocorrencia: Ocorrencia = {
      id: novoId(),
      alunoId,
      categoria,
      prioridade,
      descricao,
      local: input.local ?? "",
      testemunhas: input.testemunhas ?? "",
      bimestre: input.bimestre,
      status: StatusOcorrencia.REGISTRADA,
      criadoPorId: actor.id,
      criadoEm: now,
      atualizadoEm: now
    };
    const historico: OcorrenciaHistorico = {
      id: novoId(),
      ocorrenciaId: ocorrencia.id,
      status: StatusOcorrencia.REGISTRADA,
      acao: "Ocorrencia registrada",
      observacao: null,
      usuarioId: actor.id,
      criadoEm: now
    };

    await this.ocorrencias.create(ocorrencia, historico);

    const destinatarios: DestinatarioNotificacao[] =
      turma.tipoEnsino === TipoEnsino.TECNICO
        ? ["PAET", "COORDENACAO", "DIRECAO"]
        : ["COORDENACAO", "DIRECAO"];

    await this.notificacoes.createMany(
      destinatarios.map((destinatario) => ({
        id: novoId(),
        ocorrenciaId: ocorrencia.id,
        destinatario,
        resultado: "ENVIADO" as const,
        criadoEm: now
      }))
    );
    await this.audit.create({
      id: novoId(),
      usuarioId: actor.id,
      acao: "OCORRENCIA_CRIADA",
      entidade: "ocorrencias",
      entidadeId: ocorrencia.id,
      metadata: { alunoId },
      criadoEm: now
    });

    return ocorrencia;
  }

  // Regra de edicao: somente o autor, somente enquanto REGISTRADA, e toda
  // edicao gera registro de historico (rastreabilidade completa).
  async update(id: string, input: OcorrenciaUpdateInput, actor: AuthenticatedUser): Promise<Ocorrencia> {
    const current = await this.get(id, actor);

    if (current.criadoPorId !== actor.id) {
      throw forbidden("Apenas o autor da ocorrencia pode edita-la.");
    }
    if (current.status !== StatusOcorrencia.REGISTRADA) {
      throw conflict("Ocorrencia so pode ser editada enquanto estiver em REGISTRADA.");
    }

    // Sem campo algum nao ha edicao: evita poluir o historico com registro vazio.
    const temAlteracao = Object.values(input).some((valor) => valor !== undefined);
    if (!temAlteracao) {
      throw badRequest("Informe pelo menos um campo para editar.");
    }

    const now = agoraIso();
    const historico: OcorrenciaHistorico = {
      id: novoId(),
      ocorrenciaId: id,
      status: current.status,
      acao: "Ocorrencia editada pelo autor",
      observacao: null,
      usuarioId: actor.id,
      criadoEm: now
    };

    const updated = await this.ocorrencias.updateWithHistorico(
      id,
      (ocorrencia) => ({
        ...ocorrencia,
        categoria: input.categoria ?? ocorrencia.categoria,
        prioridade: input.prioridade ?? ocorrencia.prioridade,
        descricao: input.descricao ?? ocorrencia.descricao,
        local: input.local ?? ocorrencia.local ?? "",
        testemunhas: input.testemunhas ?? ocorrencia.testemunhas ?? "",
        atualizadoEm: now
      }),
      historico
    );

    if (!updated) {
      throw notFound("Ocorrencia nao encontrada.");
    }

    await this.audit.create({
      id: novoId(),
      usuarioId: actor.id,
      acao: "OCORRENCIA_ATUALIZADA",
      entidade: "ocorrencias",
      entidadeId: updated.id,
      metadata: {},
      criadoEm: now
    });

    return updated;
  }

  async updateStatus(
    id: string,
    status: StatusOcorrencia,
    actor: AuthenticatedUser,
    observacao?: string
  ): Promise<Ocorrencia> {
    const current = await this.get(id, actor);
    if (current.status === StatusOcorrencia.ENCERRADA) {
      throw conflict("Ocorrencia encerrada nao pode ser alterada.");
    }

    if (proximoStatus[current.status] !== status) {
      throw conflict("Status nao pode pular etapas.");
    }

    if (status === StatusOcorrencia.EM_ANALISE && actor.papel !== PapelUsuario.COORDENADOR) {
      throw forbidden("Apenas coordenador pode colocar ocorrencia em analise.");
    }
    if (status === StatusOcorrencia.RESOLVIDA && actor.papel !== PapelUsuario.COORDENADOR) {
      throw forbidden("Apenas coordenador pode resolver ocorrencia.");
    }
    if (status === StatusOcorrencia.ENCERRADA && actor.papel !== PapelUsuario.DIRETOR) {
      throw forbidden("Apenas diretor pode encerrar ocorrencia.");
    }

    const now = agoraIso();
    const historico: OcorrenciaHistorico = {
      id: novoId(),
      ocorrenciaId: id,
      status,
      acao: `Status alterado de ${current.status} para ${status}`,
      observacao: observacao?.trim() ? observacao.trim() : null,
      usuarioId: actor.id,
      criadoEm: now
    };

    const updated = await this.ocorrencias.updateWithHistorico(
      id,
      (ocorrencia) => ({
        ...ocorrencia,
        status,
        atualizadoEm: now
      }),
      historico
    );

    if (!updated) {
      throw notFound("Ocorrencia nao encontrada.");
    }

    await this.audit.create({
      id: novoId(),
      usuarioId: actor.id,
      acao: "OCORRENCIA_STATUS_ALTERADO",
      entidade: "ocorrencias",
      entidadeId: id,
      metadata: { de: current.status, para: status },
      criadoEm: now
    });

    return updated;
  }
}
