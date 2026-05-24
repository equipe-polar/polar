import type { DatabaseClient } from "../database.js";
import type { Turma } from "../../domain.js";

export class TurmaRepository {
  constructor(private readonly db: DatabaseClient) {}

  async list(): Promise<Turma[]> {
    const state = await this.db.read();
    return state.turmas;
  }

  async findById(id: string): Promise<Turma | null> {
    const state = await this.db.read();
    return state.turmas.find((turma) => turma.id === id) ?? null;
  }

  async findByNome(nome: string): Promise<Turma | null> {
    const normalized = nome.trim().toLowerCase();
    const state = await this.db.read();
    return state.turmas.find((turma) => turma.nome.toLowerCase() === normalized) ?? null;
  }

  async create(turma: Turma): Promise<Turma> {
    return this.db.transaction((state) => {
      state.turmas.push(turma);
      return turma;
    });
  }

  async update(id: string, updater: (turma: Turma) => Turma): Promise<Turma | null> {
    return this.db.transaction((state) => {
      const index = state.turmas.findIndex((turma) => turma.id === id);
      const current = state.turmas[index];
      if (index < 0 || !current) {
        return null;
      }

      const updated = updater(current);
      state.turmas[index] = updated;
      return updated;
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.db.transaction((state) => {
      const index = state.turmas.findIndex((turma) => turma.id === id);
      if (index < 0) {
        return false;
      }

      state.turmas.splice(index, 1);
      return true;
    });
  }
}
