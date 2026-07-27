import type { DatabaseClient } from "../database.js";
import type { Falta } from "../../domain.js";

export interface FaltaRepository {
  create(falta: Falta): Promise<Falta>;
  listByAluno(alunoId: string): Promise<Falta[]>;
}

export class JsonFaltaRepository implements FaltaRepository {
  constructor(private readonly db: DatabaseClient) {}

  async create(falta: Falta): Promise<Falta> {
    return this.db.transaction((state) => {
      state.faltas.push(falta);
      return falta;
    });
  }

  async listByAluno(alunoId: string): Promise<Falta[]> {
    const state = await this.db.read();
    return state.faltas.filter((falta) => falta.alunoId === alunoId);
  }
}
