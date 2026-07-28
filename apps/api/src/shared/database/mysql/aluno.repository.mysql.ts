import type { Pool, RowDataPacket } from "mysql2/promise";
import type { Aluno } from "../../domain.js";
import type { AlunoRepository } from "../repositories/aluno.repository.js";
import { boolFromDb, dbBool, dbDateTime, isoFromDbRequired, withTransaction } from "./mysql-client.js";

interface AlunoRow extends RowDataPacket {
  id: string;
  nome: string;
  matricula: string;
  turma_id: string;
  responsavel_nome: string;
  responsavel_contato: string;
  ativo: number;
  criado_em: Date;
  atualizado_em: Date;
}

function toAluno(row: AlunoRow): Aluno {
  return {
    id: row.id,
    nome: row.nome,
    matricula: row.matricula,
    turmaId: row.turma_id,
    responsavelNome: row.responsavel_nome,
    responsavelContato: row.responsavel_contato,
    ativo: boolFromDb(row.ativo),
    criadoEm: isoFromDbRequired(row.criado_em),
    atualizadoEm: isoFromDbRequired(row.atualizado_em)
  };
}

const COLUNAS = "id, nome, matricula, turma_id, responsavel_nome, responsavel_contato, ativo, criado_em, atualizado_em";

export class MysqlAlunoRepository implements AlunoRepository {
  constructor(private readonly pool: Pool) {}

  async list(): Promise<Aluno[]> {
    const [rows] = await this.pool.query<AlunoRow[]>(`SELECT ${COLUNAS} FROM alunos ORDER BY nome`);
    return rows.map(toAluno);
  }

  async findById(id: string): Promise<Aluno | null> {
    const [rows] = await this.pool.query<AlunoRow[]>(`SELECT ${COLUNAS} FROM alunos WHERE id = ? LIMIT 1`, [id]);
    const row = rows[0];
    return row ? toAluno(row) : null;
  }

  async findByMatricula(matricula: string): Promise<Aluno | null> {
    const [rows] = await this.pool.query<AlunoRow[]>(
      `SELECT ${COLUNAS} FROM alunos WHERE LOWER(matricula) = ? LIMIT 1`,
      [matricula.trim().toLowerCase()]
    );
    const row = rows[0];
    return row ? toAluno(row) : null;
  }

  async listByTurma(turmaId: string): Promise<Aluno[]> {
    const [rows] = await this.pool.query<AlunoRow[]>(
      `SELECT ${COLUNAS} FROM alunos WHERE turma_id = ? AND ativo = 1 ORDER BY nome`,
      [turmaId]
    );
    return rows.map(toAluno);
  }

  async create(aluno: Aluno): Promise<Aluno> {
    await this.pool.execute(`INSERT INTO alunos (${COLUNAS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      aluno.id,
      aluno.nome,
      aluno.matricula,
      aluno.turmaId,
      aluno.responsavelNome,
      aluno.responsavelContato,
      dbBool(aluno.ativo),
      dbDateTime(aluno.criadoEm),
      dbDateTime(aluno.atualizadoEm)
    ]);
    return aluno;
  }

  async update(id: string, updater: (aluno: Aluno) => Aluno): Promise<Aluno | null> {
    return withTransaction(this.pool, async (conn) => {
      const [rows] = await conn.query<AlunoRow[]>(`SELECT ${COLUNAS} FROM alunos WHERE id = ? LIMIT 1 FOR UPDATE`, [id]);
      const row = rows[0];
      if (!row) {
        return null;
      }

      const updated = updater(toAluno(row));
      await conn.execute(
        `UPDATE alunos
           SET nome = ?, matricula = ?, turma_id = ?, responsavel_nome = ?, responsavel_contato = ?, ativo = ?, atualizado_em = ?
         WHERE id = ?`,
        [
          updated.nome,
          updated.matricula,
          updated.turmaId,
          updated.responsavelNome,
          updated.responsavelContato,
          dbBool(updated.ativo),
          dbDateTime(updated.atualizadoEm),
          id
        ]
      );
      return updated;
    });
  }
}
