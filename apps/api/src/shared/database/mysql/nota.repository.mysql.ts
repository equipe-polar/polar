import type { Pool, RowDataPacket } from "mysql2/promise";
import type { Nota } from "../../domain.js";
import type { NotaRepository } from "../repositories/nota.repository.js";
import { dateOnlyFromDb, dbDateTime, isoFromDbRequired } from "./mysql-client.js";

interface NotaRow extends RowDataPacket {
  id: string;
  aluno_id: string;
  disciplina: string;
  valor: number;
  etapa: string;
  professor_id: string;
  data: Date;
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

export class MysqlNotaRepository implements NotaRepository {
  constructor(private readonly pool: Pool) {}

  async create(nota: Nota): Promise<Nota> {
    await this.pool.execute(`INSERT INTO notas (${COLUNAS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
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
    const [rows] = await this.pool.query<NotaRow[]>(
      `SELECT ${COLUNAS} FROM notas WHERE aluno_id = ? ORDER BY data DESC, criado_em DESC`,
      [alunoId]
    );
    return rows.map(toNota);
  }
}
