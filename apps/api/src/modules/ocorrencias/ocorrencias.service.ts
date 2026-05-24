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
  alunoId?: string | undefined;
  studentId?: string | undefined;
  categoria?: string | undefined;
  type?: string | undefined;
  prioridade?: PrioridadeOcorrencia | undefined;
  severity?: PrioridadeOcorrencia | undefined;
  descricao?: string | undefined;
  description?: string | undefined;
  local?: string | undefined;
  testemunhas?: string | undefined;
}

export interface OcorrenciaUpdateInput {
  categoria?: string | undefined;
  type?: string | undefined;
  prioridade?: PrioridadeOcorrencia | undefined;
  severity?: PrioridadeOcorrencia | undefined;
  descricao?: string | undefined;
  description?: string | undefined;
  local?: string | undefined;
  testemunhas?: string | undefined;
}

export class OcorrenciasService {
  constructor(
    private readonly ocorrencias: OcorrenciaRepository,
    private readonly alunos: AlunoRepository,
    private readonly audit: AuditRepository
  ) {}

  async list(): Promise<Ocorrencia[]> {
    return this.ocorrencias.list();
  }

  async get(id: string): Promise<Ocorrencia> {
    const ocorrencia = await this.ocorrencias.findById(id);
    if (!ocorrencia) {
      throw notFound("Ocorrencia nao encontrada.");
    }
    return ocorrencia;
  }

  async historico(id: string): Promise<OcorrenciaHistorico[]> {
    await this.get(id);
    return this.ocorrencias.listHistorico(id);
  }

  async create(input: OcorrenciaCreateInput, actor: AuthenticatedUser): Promise<Ocorrencia> {
    const alunoId = input.alunoId ?? input.studentId ?? "";
    const categoria = input.categoria ?? input.type ?? "";
    const descricao = input.descricao ?? input.description ?? "";
    const prioridade = input.prioridade ?? input.severity ?? PrioridadeOcorrencia.MEDIA;

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

  async update(id: string, input: OcorrenciaUpdateInput, actor: AuthenticatedUser): Promise<Ocorrencia> {
    const current = await this.get(id);
    if (current.status === StatusOcorrencia.ENCERRADA) {
      throw conflict("Ocorrencia encerrada nao pode ser alterada.");
    }

    const now = agoraIso();
    const updated = await this.ocorrencias.updateWithHistorico(id, (ocorrencia) => ({
      ...ocorrencia,
      categoria: input.categoria ?? input.type ?? ocorrencia.categoria,
      prioridade: input.prioridade ?? input.severity ?? ocorrencia.prioridade,
      descricao: input.descricao ?? input.description ?? ocorrencia.descricao,
      local: input.local ?? ocorrencia.local ?? "",
      testemunhas: input.testemunhas ?? ocorrencia.testemunhas ?? "",
      atualizadoEm: now
    }));

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

  async updateStatus(id: string, status: StatusOcorrencia, actor: AuthenticatedUser): Promise<Ocorrencia> {
    const current = await this.get(id);
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
