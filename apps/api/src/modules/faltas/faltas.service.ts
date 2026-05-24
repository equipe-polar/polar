import { badRequest } from "../../shared/errors/app-error.js";
import type { Falta } from "../../shared/domain.js";
import type { AlunoRepository } from "../../shared/database/repositories/aluno.repository.js";
import type { FaltaRepository } from "../../shared/database/repositories/falta.repository.js";
import type { AuditRepository } from "../../shared/database/repositories/audit.repository.js";
import { agoraIso, novoId } from "../../shared/utils/ids.js";

export class FaltasService {
  constructor(
    private readonly faltas: FaltaRepository,
    private readonly alunos: AlunoRepository,
    private readonly audit: AuditRepository
  ) {}

  async create(
    input: { alunoId: string; data: string; justificativa?: string | null | undefined },
    registradaPorId: string
  ): Promise<Falta> {
    const aluno = await this.alunos.findById(input.alunoId);
    if (!aluno || !aluno.ativo) {
      throw badRequest("Falta deve estar vinculada a aluno valido.");
    }

    const falta: Falta = {
      id: novoId(),
      alunoId: input.alunoId,
      data: input.data,
      justificativa: input.justificativa ?? null,
      registradaPorId,
      criadoEm: agoraIso()
    };

    await this.faltas.create(falta);
    await this.audit.create({
      id: novoId(),
      usuarioId: registradaPorId,
      acao: "FALTA_REGISTRADA",
      entidade: "faltas",
      entidadeId: falta.id,
      metadata: { alunoId: falta.alunoId, data: falta.data },
      criadoEm: falta.criadoEm
    });
    return falta;
  }

  async listByAluno(alunoId: string): Promise<Falta[]> {
    return this.faltas.listByAluno(alunoId);
  }
}
