import type { Pool, RowDataPacket } from "mysql2/promise";
import type { Falta } from "../../domain.js";
import type { FaltaRepository } from "../repositories/falta.repository.js";
import { dateOnlyFromDb, dbDateTime, isoFromDbRequired } from "./mysql-client.js";

interface FaltaRow extends RowDataPacket {
  id: string;
  aluno_id: string;
  data: Date;
  justificativa: string | null;
  registrada_por_id: string;
  criado_em: Date;
}

function toFalta(row: FaltaRow): Falta {
  return {
    id: row.id,
    alunoId: row.aluno_id,
    data: dateOnlyFromDb(row.data),
    justificativa: row.justificativa,
    registradaPorId: row.registrada_por_id,
    criadoEm: isoFromDbRequired(row.criado_em)
  };
}

const COLUNAS = "id, aluno_id, data, justificativa, registrada_por_id, criado_em";

export class MysqlFaltaRepository implements FaltaRepository {
  constructor(private readonly pool: Pool) {}

  async create(falta: Falta): Promise<Falta> {
    await this.pool.execute(`INSERT INTO faltas (${COLUNAS}) VALUES (?, ?, ?, ?, ?, ?)`, [
      falta.id,
      falta.alunoId,
      falta.data,
      falta.justificativa,
      falta.registradaPorId,
      dbDateTime(falta.criadoEm)
    ]);
    return falta;
  }

  async listByAluno(alunoId: string): Promise<Falta[]> {
    const [rows] = await this.pool.query<FaltaRow[]>(
      `SELECT ${COLUNAS} FROM faltas WHERE aluno_id = ? ORDER BY data DESC`,
      [alunoId]
    );
    return rows.map(toFalta);
  }
}
