import type { Pool } from "pg";
import type { AlunoTurmaHistorico } from "../../domain.js";
import type { AlunoTurmaHistoricoRepository } from "../repositories/aluno-turma-historico.repository.js";
import { dbDateTime, isoFromDbRequired } from "./postgres-client.js";

interface AlunoTurmaHistoricoRow {
  id: string;
  aluno_id: string;
  turma_id: string;
  ano_letivo: number;
  criado_em: Date;
}

function toHistorico(row: AlunoTurmaHistoricoRow): AlunoTurmaHistorico {
  return {
    id: row.id,
    alunoId: row.aluno_id,
    turmaId: row.turma_id,
    anoLetivo: row.ano_letivo,
    criadoEm: isoFromDbRequired(row.criado_em)
  };
}

const COLUNAS = "id, aluno_id, turma_id, ano_letivo, criado_em";

export class PostgresAlunoTurmaHistoricoRepository
  implements AlunoTurmaHistoricoRepository
{
  constructor(private readonly pool: Pool) {}

  async listByAluno(alunoId: string): Promise<AlunoTurmaHistorico[]> {
    const { rows } = await this.pool.query<AlunoTurmaHistoricoRow>(
      `SELECT ${COLUNAS}
       FROM alunos_turmas_historico
       WHERE aluno_id = $1
       ORDER BY ano_letivo`,
      [alunoId]
    );

    return rows.map(toHistorico);
  }

  async listByAno(anoLetivo: number): Promise<AlunoTurmaHistorico[]> {
    const { rows } = await this.pool.query<AlunoTurmaHistoricoRow>(
      `SELECT ${COLUNAS}
       FROM alunos_turmas_historico
       WHERE ano_letivo = $1
       ORDER BY aluno_id`,
      [anoLetivo]
    );

    return rows.map(toHistorico);
  }

  async findByAlunoEAno(
    alunoId: string,
    anoLetivo: number
  ): Promise<AlunoTurmaHistorico | null> {
    const { rows } = await this.pool.query<AlunoTurmaHistoricoRow>(
      `SELECT ${COLUNAS}
       FROM alunos_turmas_historico
       WHERE aluno_id = $1 AND ano_letivo = $2
       LIMIT 1`,
      [alunoId, anoLetivo]
    );

    const row = rows[0];
    return row ? toHistorico(row) : null;
  }

  async create(
    historico: AlunoTurmaHistorico
  ): Promise<AlunoTurmaHistorico> {
    await this.pool.query(
      `INSERT INTO alunos_turmas_historico
        (id, aluno_id, turma_id, ano_letivo, criado_em)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        historico.id,
        historico.alunoId,
        historico.turmaId,
        historico.anoLetivo,
        dbDateTime(historico.criadoEm)
      ]
    );

    return historico;
  }
}