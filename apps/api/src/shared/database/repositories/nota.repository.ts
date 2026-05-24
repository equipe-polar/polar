import type { DatabaseClient } from "../database.js";
import type { Nota } from "../../domain.js";

export class NotaRepository {
  constructor(private readonly db: DatabaseClient) {}

  async create(nota: Nota): Promise<Nota> {
    return this.db.transaction((state) => {
      state.notas.push(nota);
      return nota;
    });
  }

  async listByAluno(alunoId: string): Promise<Nota[]> {
    const state = await this.db.read();
    return state.notas.filter((nota) => nota.alunoId === alunoId);
  }
}
