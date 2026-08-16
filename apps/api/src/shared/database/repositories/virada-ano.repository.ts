import type { Aluno, Turma } from "../../domain.js";

export interface ViradaAnoTurmaInput {
  turmaOrigem: Turma;
  turmaDestino: Turma;
  alunos: Aluno[];
}

export interface ViradaAnoRepository {
  executar(
    anoOrigem: number,
    anoDestino: number,
    turmas: ViradaAnoTurmaInput[],
    actorId: string
  ): Promise<Turma[]>;
}