import { badRequest } from "../../shared/errors/app-error.js";
import type { Nota } from "../../shared/domain.js";
import type { AlunoRepository } from "../../shared/database/repositories/aluno.repository.js";
import type { NotaRepository } from "../../shared/database/repositories/nota.repository.js";
import type { AuditRepository } from "../../shared/database/repositories/audit.repository.js";
import { agoraIso, novoId } from "../../shared/utils/ids.js";

export class NotasService {
  constructor(
    private readonly notas: NotaRepository,
    private readonly alunos: AlunoRepository,
    private readonly audit: AuditRepository
  ) {}

  async create(input: Omit<Nota, "id" | "professorId" | "criadoEm">, professorId: string): Promise<Nota> {
    const aluno = await this.alunos.findById(input.alunoId);
    if (!aluno || !aluno.ativo) {
      throw badRequest("Nota deve estar vinculada a aluno valido.");
    }

    const nota: Nota = {
      ...input,
      id: novoId(),
      professorId,
      criadoEm: agoraIso()
    };

    await this.notas.create(nota);
    await this.audit.create({
      id: novoId(),
      usuarioId: professorId,
      acao: "NOTA_REGISTRADA",
      entidade: "notas",
      entidadeId: nota.id,
      metadata: { alunoId: nota.alunoId, valor: nota.valor },
      criadoEm: nota.criadoEm
    });
    return nota;
  }

  async listByAluno(alunoId: string): Promise<Nota[]> {
    return this.notas.listByAluno(alunoId);
  }
}
