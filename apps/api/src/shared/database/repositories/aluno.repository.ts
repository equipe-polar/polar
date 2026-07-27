import type { DatabaseClient } from "../database.js";
import type { Aluno } from "../../domain.js";

export interface AlunoRepository {
  list(): Promise<Aluno[]>;
  findById(id: string): Promise<Aluno | null>;
  findByMatricula(matricula: string): Promise<Aluno | null>;
  listByTurma(turmaId: string): Promise<Aluno[]>;
  create(aluno: Aluno): Promise<Aluno>;
  update(id: string, updater: (aluno: Aluno) => Aluno): Promise<Aluno | null>;
}

export class JsonAlunoRepository implements AlunoRepository {
  constructor(private readonly db: DatabaseClient) {}

  async list(): Promise<Aluno[]> {
    const state = await this.db.read();
    return state.alunos;
  }

  async findById(id: string): Promise<Aluno | null> {
    const state = await this.db.read();
    return state.alunos.find((aluno) => aluno.id === id) ?? null;
  }

  async findByMatricula(matricula: string): Promise<Aluno | null> {
    const normalized = matricula.trim().toLowerCase();
    const state = await this.db.read();
    return state.alunos.find((aluno) => aluno.matricula.toLowerCase() === normalized) ?? null;
  }

  async listByTurma(turmaId: string): Promise<Aluno[]> {
    const state = await this.db.read();
    return state.alunos.filter((aluno) => aluno.turmaId === turmaId && aluno.ativo);
  }

  async create(aluno: Aluno): Promise<Aluno> {
    return this.db.transaction((state) => {
      state.alunos.push(aluno);
      return aluno;
    });
  }

  async update(id: string, updater: (aluno: Aluno) => Aluno): Promise<Aluno | null> {
    return this.db.transaction((state) => {
      const index = state.alunos.findIndex((aluno) => aluno.id === id);
      const current = state.alunos[index];
      if (index < 0 || !current) {
        return null;
      }

      const updated = updater(current);
      state.alunos[index] = updated;
      return updated;
    });
  }
}
