import type { Pool } from "pg";
import type { Nota } from "../../domain.js";
import type { NotaRepository } from "../repositories/nota.repository.js";
import { dateOnlyFromDb, dbDateTime, isoFromDbRequired } from "./postgres-client.js";

interface NotaRow {
  id: string;
  aluno_id: string;
  disciplina: string;
  // NUMERIC chega como number gracas ao parser registrado em postgres-client.
  valor: number;
  etapa: string;
  professor_id: string;
  data: string;
  criado_em: Date;
}

function toNota(row: NotaRow): Nota {
  return {
    id: row.id,
    alunoId: row.aluno_id,
    disciplina: row.disciplina,
    valor: row.valor,
    etapa: row.etapa,
    professorId: row.professor_id,
    data: dateOnlyFromDb(row.data),
    criadoEm: isoFromDbRequired(row.criado_em)
  };
}

const COLUNAS = "id, aluno_id, disciplina, valor, etapa, professor_id, data, criado_em";

export class PostgresNotaRepository implements NotaRepository {
  constructor(private readonly pool: Pool) {}

  async create(nota: Nota): Promise<Nota> {
    await this.pool.query(`INSERT INTO notas (${COLUNAS}) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
      nota.id,
      nota.alunoId,
      nota.disciplina,
      nota.valor,
      nota.etapa,
      nota.professorId,
      nota.data,
      dbDateTime(nota.criadoEm)
    ]);
    return nota;
  }

  async listByAluno(alunoId: string): Promise<Nota[]> {
    const { rows } = await this.pool.query<NotaRow>(
      `SELECT ${COLUNAS} FROM notas WHERE aluno_id = $1 ORDER BY data DESC, criado_em DESC`,
      [alunoId]
    );
    return rows.map(toNota);
  }
}
