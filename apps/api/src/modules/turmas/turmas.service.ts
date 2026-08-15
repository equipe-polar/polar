import { conflict, notFound } from "../../shared/errors/app-error.js";
import type { Turma } from "../../shared/domain.js";
import type { TurmaRepository } from "../../shared/database/repositories/turma.repository.js";
import type { AlunoRepository } from "../../shared/database/repositories/aluno.repository.js";
import type { AlunoTurmaHistoricoRepository } from "../../shared/database/repositories/aluno-turma-historico.repository.js";
import type { AuditRepository } from "../../shared/database/repositories/audit.repository.js";
import { agoraIso, novoId } from "../../shared/utils/ids.js";

export class TurmasService {
  constructor(
    private readonly turmas: TurmaRepository,
    private readonly alunos: AlunoRepository,
    private readonly alunosTurmasHistorico: AlunoTurmaHistoricoRepository,
    private readonly audit: AuditRepository
  ) {}

  async list(): Promise<Turma[]> {
    return this.turmas.list();
  }

  async create(input: { nome: string; anoLetivo: number; turno: string }, actorId: string): Promise<Turma> {
    const existing = await this.turmas.findByNome(input.nome);
    if (existing) {
      throw conflict("Turma ja cadastrada.");
    }

    const now = agoraIso();
    const turma: Turma = {
      id: novoId(),
      nome: input.nome,
      anoLetivo: input.anoLetivo,
      turno: input.turno,
      ativa: true,
      criadoEm: now,
      atualizadoEm: now
    };

    await this.turmas.create(turma);
    await this.audit.create({
      id: novoId(),
      usuarioId: actorId,
      acao: "TURMA_CRIADA",
      entidade: "turmas",
      entidadeId: turma.id,
      metadata: { nome: turma.nome },
      criadoEm: now
    });
    return turma;
  }

  async update(
    id: string,
    input: {
      nome?: string | undefined;
      anoLetivo?: number | undefined;
      turno?: string | undefined;
      ativa?: boolean | undefined;
    },
    actorId: string
  ): Promise<Turma> {
    const now = agoraIso();
    const updated = await this.turmas.update(id, (current) => ({
      ...current,
      nome: input.nome ?? current.nome,
      anoLetivo: input.anoLetivo ?? current.anoLetivo,
      turno: input.turno ?? current.turno,
      ativa: input.ativa ?? current.ativa,
      atualizadoEm: now
    }));

    if (!updated) {
      throw notFound("Turma nao encontrada.");
    }

    await this.audit.create({
      id: novoId(),
      usuarioId: actorId,
      acao: "TURMA_ATUALIZADA",
      entidade: "turmas",
      entidadeId: updated.id,
      metadata: {},
      criadoEm: now
    });
    return updated;
  }

  // Exclusao fisica nao existe no POLAR: turmas sao inativadas para preservar
  // o historico institucional. Turma com alunos ativos nao pode ser inativada.
  async delete(id: string, actorId: string): Promise<void> {
    const alunosDaTurma = await this.alunos.listByTurma(id);
    if (alunosDaTurma.length > 0) {
      throw conflict("Nao e permitido inativar turma com alunos ativos vinculados.");
    }

    const now = agoraIso();
    const updated = await this.turmas.update(id, (current) => ({
      ...current,
      ativa: false,
      atualizadoEm: now
    }));
    if (!updated) {
      throw notFound("Turma nao encontrada.");
    }

    await this.audit.create({
      id: novoId(),
      usuarioId: actorId,
      acao: "TURMA_INATIVADA",
      entidade: "turmas",
      entidadeId: id,
      metadata: {},
      criadoEm: now
    });
  }
}
