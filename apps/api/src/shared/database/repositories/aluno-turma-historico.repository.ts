import type { AlunoTurmaHistorico } from "../../domain.js";
import type { DatabaseClient } from "../database.js";

export interface AlunoTurmaHistoricoRepository {
  listByAluno(alunoId: string): Promise<AlunoTurmaHistorico[]>;
  listByAno(anoLetivo: number): Promise<AlunoTurmaHistorico[]>;
  findByAlunoEAno(alunoId: string, anoLetivo: number): Promise<AlunoTurmaHistorico | null>;
  create(historico: AlunoTurmaHistorico): Promise<AlunoTurmaHistorico>;
}

export class JsonAlunoTurmaHistoricoRepository implements AlunoTurmaHistoricoRepository {
  constructor(private readonly db: DatabaseClient) {}

  async listByAluno(alunoId: string): Promise<AlunoTurmaHistorico[]> {
    const state = await this.db.read();

    return state.alunosTurmasHistorico.filter(
      (item) => item.alunoId === alunoId
    );
  }

  async listByAno(anoLetivo: number): Promise<AlunoTurmaHistorico[]> {
    const state = await this.db.read();

    return state.alunosTurmasHistorico.filter(
      (item) => item.anoLetivo === anoLetivo
    );
  }

  async findByAlunoEAno(
    alunoId: string,
    anoLetivo: number
  ): Promise<AlunoTurmaHistorico | null> {
    const state = await this.db.read();

    return (
      state.alunosTurmasHistorico.find(
        (item) =>
          item.alunoId === alunoId &&
          item.anoLetivo === anoLetivo
      ) ?? null
    );
  }

  async create(
    historico: AlunoTurmaHistorico
  ): Promise<AlunoTurmaHistorico> {
    return this.db.transaction((state) => {
      state.alunosTurmasHistorico.push(historico);
      return historico;
    });
  }
}