import type { Pool, RowDataPacket } from "mysql2/promise";
import type { Turma } from "../../domain.js";
import type { TurmaRepository } from "../repositories/turma.repository.js";
import { boolFromDb, dbBool, dbDateTime, isoFromDbRequired, withTransaction } from "./mysql-client.js";

interface TurmaRow extends RowDataPacket {
  id: string;
  nome: string;
  ano_letivo: number;
  turno: string;
  ativa: number;
  criado_em: Date;
  atualizado_em: Date;
}

function toTurma(row: TurmaRow): Turma {
  return {
    id: row.id,
    nome: row.nome,
    anoLetivo: row.ano_letivo,
    turno: row.turno,
    ativa: boolFromDb(row.ativa),
    criadoEm: isoFromDbRequired(row.criado_em),
    atualizadoEm: isoFromDbRequired(row.atualizado_em)
  };
}

const COLUNAS = "id, nome, ano_letivo, turno, ativa, criado_em, atualizado_em";

export class MysqlTurmaRepository implements TurmaRepository {
  constructor(private readonly pool: Pool) {}

  async list(): Promise<Turma[]> {
    const [rows] = await this.pool.query<TurmaRow[]>(`SELECT ${COLUNAS} FROM turmas ORDER BY nome`);
    return rows.map(toTurma);
  }

  async findById(id: string): Promise<Turma | null> {
    const [rows] = await this.pool.query<TurmaRow[]>(`SELECT ${COLUNAS} FROM turmas WHERE id = ? LIMIT 1`, [id]);
    const row = rows[0];
    return row ? toTurma(row) : null;
  }

  async findByNome(nome: string): Promise<Turma | null> {
    const [rows] = await this.pool.query<TurmaRow[]>(
      `SELECT ${COLUNAS} FROM turmas WHERE LOWER(nome) = ? LIMIT 1`,
      [nome.trim().toLowerCase()]
    );
    const row = rows[0];
    return row ? toTurma(row) : null;
  }

  async create(turma: Turma): Promise<Turma> {
    await this.pool.execute(`INSERT INTO turmas (${COLUNAS}) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
      turma.id,
      turma.nome,
      turma.anoLetivo,
      turma.turno,
      dbBool(turma.ativa),
      dbDateTime(turma.criadoEm),
      dbDateTime(turma.atualizadoEm)
    ]);
    return turma;
  }

  async update(id: string, updater: (turma: Turma) => Turma): Promise<Turma | null> {
    return withTransaction(this.pool, async (conn) => {
      const [rows] = await conn.query<TurmaRow[]>(`SELECT ${COLUNAS} FROM turmas WHERE id = ? LIMIT 1 FOR UPDATE`, [id]);
      const row = rows[0];
      if (!row) {
        return null;
      }

      const updated = updater(toTurma(row));
      await conn.execute(
        `UPDATE turmas SET nome = ?, ano_letivo = ?, turno = ?, ativa = ?, atualizado_em = ? WHERE id = ?`,
        [updated.nome, updated.anoLetivo, updated.turno, dbBool(updated.ativa), dbDateTime(updated.atualizadoEm), id]
      );
      return updated;
    });
  }
}
