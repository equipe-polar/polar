import type { Pool } from "pg";
import type { Turma } from "../../domain.js";
import type { TurmaRepository } from "../repositories/turma.repository.js";
import { dbDateTime, isoFromDbRequired, withTransaction } from "./postgres-client.js";

interface TurmaRow {
  id: string;
  nome: string;
  ano_letivo: number;
  turno: string;
  ativa: boolean;
  criado_em: Date;
  atualizado_em: Date;
}

function toTurma(row: TurmaRow): Turma {
  return {
    id: row.id,
    nome: row.nome,
    anoLetivo: row.ano_letivo,
    turno: row.turno,
    ativa: row.ativa,
    criadoEm: isoFromDbRequired(row.criado_em),
    atualizadoEm: isoFromDbRequired(row.atualizado_em)
  };
}

const COLUNAS = "id, nome, ano_letivo, turno, ativa, criado_em, atualizado_em";

export class PostgresTurmaRepository implements TurmaRepository {
  constructor(private readonly pool: Pool) {}

  async list(): Promise<Turma[]> {
    const { rows } = await this.pool.query<TurmaRow>(`SELECT ${COLUNAS} FROM turmas ORDER BY nome`);
    return rows.map(toTurma);
  }

  async findById(id: string): Promise<Turma | null> {
    const { rows } = await this.pool.query<TurmaRow>(`SELECT ${COLUNAS} FROM turmas WHERE id = $1 LIMIT 1`, [id]);
    const row = rows[0];
    return row ? toTurma(row) : null;
  }

  async findByNome(nome: string): Promise<Turma | null> {
    const { rows } = await this.pool.query<TurmaRow>(
      `SELECT ${COLUNAS} FROM turmas WHERE LOWER(nome) = $1 LIMIT 1`,
      [nome.trim().toLowerCase()]
    );
    const row = rows[0];
    return row ? toTurma(row) : null;
  }

  async create(turma: Turma): Promise<Turma> {
    await this.pool.query(`INSERT INTO turmas (${COLUNAS}) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
      turma.id,
      turma.nome,
      turma.anoLetivo,
      turma.turno,
      turma.ativa,
      dbDateTime(turma.criadoEm),
      dbDateTime(turma.atualizadoEm)
    ]);
    return turma;
  }

  async update(id: string, updater: (turma: Turma) => Turma): Promise<Turma | null> {
    return withTransaction(this.pool, async (client) => {
      const { rows } = await client.query<TurmaRow>(
        `SELECT ${COLUNAS} FROM turmas WHERE id = $1 LIMIT 1 FOR UPDATE`,
        [id]
      );
      const row = rows[0];
      if (!row) {
        return null;
      }

      const updated = updater(toTurma(row));
      await client.query(
        `UPDATE turmas SET nome = $1, ano_letivo = $2, turno = $3, ativa = $4, atualizado_em = $5 WHERE id = $6`,
        [updated.nome, updated.anoLetivo, updated.turno, updated.ativa, dbDateTime(updated.atualizadoEm), id]
      );
      return updated;
    });
  }
}
