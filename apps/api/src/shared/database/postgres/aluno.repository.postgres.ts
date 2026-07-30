import type { Pool } from "pg";
import type { Aluno } from "../../domain.js";
import type { AlunoRepository } from "../repositories/aluno.repository.js";
import { dbDateTime, isoFromDbRequired, withTransaction } from "./postgres-client.js";

interface AlunoRow {
  id: string;
  nome: string;
  matricula: string;
  turma_id: string;
  responsavel_nome: string;
  responsavel_contato: string;
  ativo: boolean;
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
    ativo: row.ativo,
    criadoEm: isoFromDbRequired(row.criado_em),
    atualizadoEm: isoFromDbRequired(row.atualizado_em)
  };
}

const COLUNAS = "id, nome, matricula, turma_id, responsavel_nome, responsavel_contato, ativo, criado_em, atualizado_em";

export class PostgresAlunoRepository implements AlunoRepository {
  constructor(private readonly pool: Pool) {}

  async list(): Promise<Aluno[]> {
    const { rows } = await this.pool.query<AlunoRow>(`SELECT ${COLUNAS} FROM alunos ORDER BY nome`);
    return rows.map(toAluno);
  }

  async findById(id: string): Promise<Aluno | null> {
    const { rows } = await this.pool.query<AlunoRow>(`SELECT ${COLUNAS} FROM alunos WHERE id = $1 LIMIT 1`, [id]);
    const row = rows[0];
    return row ? toAluno(row) : null;
  }

  async findByMatricula(matricula: string): Promise<Aluno | null> {
    const { rows } = await this.pool.query<AlunoRow>(
      `SELECT ${COLUNAS} FROM alunos WHERE LOWER(matricula) = $1 LIMIT 1`,
      [matricula.trim().toLowerCase()]
    );
    const row = rows[0];
    return row ? toAluno(row) : null;
  }

  async listByTurma(turmaId: string): Promise<Aluno[]> {
    const { rows } = await this.pool.query<AlunoRow>(
      `SELECT ${COLUNAS} FROM alunos WHERE turma_id = $1 AND ativo = TRUE ORDER BY nome`,
      [turmaId]
    );
    return rows.map(toAluno);
  }

  async create(aluno: Aluno): Promise<Aluno> {
    await this.pool.query(`INSERT INTO alunos (${COLUNAS}) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
      aluno.id,
      aluno.nome,
      aluno.matricula,
      aluno.turmaId,
      aluno.responsavelNome,
      aluno.responsavelContato,
      aluno.ativo,
      dbDateTime(aluno.criadoEm),
      dbDateTime(aluno.atualizadoEm)
    ]);
    return aluno;
  }

  async update(id: string, updater: (aluno: Aluno) => Aluno): Promise<Aluno | null> {
    return withTransaction(this.pool, async (client) => {
      const { rows } = await client.query<AlunoRow>(
        `SELECT ${COLUNAS} FROM alunos WHERE id = $1 LIMIT 1 FOR UPDATE`,
        [id]
      );
      const row = rows[0];
      if (!row) {
        return null;
      }

      const updated = updater(toAluno(row));
      await client.query(
        `UPDATE alunos
           SET nome = $1, matricula = $2, turma_id = $3, responsavel_nome = $4, responsavel_contato = $5, ativo = $6, atualizado_em = $7
         WHERE id = $8`,
        [
          updated.nome,
          updated.matricula,
          updated.turmaId,
          updated.responsavelNome,
          updated.responsavelContato,
          updated.ativo,
          dbDateTime(updated.atualizadoEm),
          id
        ]
      );
      return updated;
    });
  }
}
