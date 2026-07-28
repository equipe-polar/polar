import { badRequest, conflict, forbidden, notFound } from "../../shared/errors/app-error.js";
import {
  PapelUsuario,
  PrioridadeOcorrencia,
  StatusOcorrencia,
  type Ocorrencia,
  type OcorrenciaHistorico
} from "../../shared/domain.js";
import type { AlunoRepository } from "../../shared/database/repositories/aluno.repository.js";
import type { OcorrenciaRepository } from "../../shared/database/repositories/ocorrencia.repository.js";
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
}

export interface OcorrenciaUpdateInput {
  categoria?: string | undefined;
  prioridade?: PrioridadeOcorrencia | undefined;
  descricao?: string | undefined;
  local?: string | undefined;
  testemunhas?: string | undefined;
}

export class OcorrenciasService {
  constructor(
    private readonly ocorrencias: OcorrenciaRepository,
    private readonly alunos: AlunoRepository,
    private readonly audit: AuditRepository
  ) {}

  // Professor consulta apenas as ocorrencias registradas por ele.
  // Coordenacao, direcao e ADM consultam todas.
  async list(actor: AuthenticatedUser): Promise<Ocorrencia[]> {
    if (actor.papel === PapelUsuario.PROFESSOR) {
      return this.ocorrencias.listByCriadoPor(actor.id);
    }
    return this.ocorrencias.list();
  }

  async get(id: string, actor: AuthenticatedUser): Promise<Ocorrencia> {
    const ocorrencia = await this.ocorrencias.findById(id);
    if (!ocorrencia) {
      throw notFound("Ocorrencia nao encontrada.");
    }
    if (actor.papel === PapelUsuario.PROFESSOR && ocorrencia.criadoPorId !== actor.id) {
      throw forbidden("Professor consulta apenas as ocorrencias registradas por ele.");
    }
    return ocorrencia;
  }

  async historico(id: string, actor: AuthenticatedUser): Promise<OcorrenciaHistorico[]> {
    await this.get(id, actor);
    return this.ocorrencias.listHistorico(id);
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
