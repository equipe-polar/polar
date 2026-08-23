import crypto from "node:crypto";
import type { Pool } from "pg";
import type { Turma } from "../../domain.js";
import type {
  ViradaAnoRepository,
  ViradaAnoTurmaInput
} from "../repositories/virada-ano.repository.js";
import { dbDateTime, withTransaction } from "./postgres-client.js";

export class PostgresViradaAnoRepository
  implements ViradaAnoRepository
{
  constructor(private readonly pool: Pool) {}

  async executar(
    _anoOrigem: number,
    _anoDestino: number,
    turmas: ViradaAnoTurmaInput[],
    actorId: string
  ): Promise<Turma[]> {
    return withTransaction(this.pool, async (client) => {
      for (const turmaInput of turmas) {
        const turma = turmaInput.turmaDestino;
        const agora = new Date();

        await client.query(
          `INSERT INTO turmas
            (id, nome, ano_letivo, turno, tipo_ensino, ativa, criado_em, atualizado_em)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            turma.id,
            turma.nome,
            turma.anoLetivo,
            turma.turno,
            turma.tipoEnsino,
            turma.ativa,
            dbDateTime(turma.criadoEm),
            dbDateTime(turma.atualizadoEm)
          ]
        );

        await client.query(
          `INSERT INTO audit_logs
            (id, usuario_id, acao, entidade, entidade_id, metadata, criado_em)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            crypto.randomUUID(),
            actorId,
            "TURMA_CRIADA",
            "turmas",
            turma.id,
            JSON.stringify({
              viradaAno: true,
              anoOrigem: turmaInput.turmaOrigem.anoLetivo,
              anoDestino: turmaInput.turmaDestino.anoLetivo
            }),
            agora
          ]
        );

        for (const aluno of turmaInput.alunos) {
          await client.query(
            `INSERT INTO alunos_turmas_historico
              (id, aluno_id, turma_id, ano_letivo, criado_em)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (aluno_id, ano_letivo) DO NOTHING`,
            [
              crypto.randomUUID(),
              aluno.id,
              turmaInput.turmaOrigem.id,
              turmaInput.turmaOrigem.anoLetivo,
              agora
            ]
          );

          const updateResult = await client.query(
            `UPDATE alunos
                SET turma_id = $1,
                    atualizado_em = $2
              WHERE id = $3`,
            [
              turmaInput.turmaDestino.id,
              agora,
              aluno.id
            ]
          );

          if (process.env.POLAR_TEST_ROLLBACK === "1") {
            throw new Error("FALHA_CONTROLADA_ROLLBACK");
            }

          if (updateResult.rowCount !== 1) {
            throw new Error(
              `Nao foi possivel atualizar o aluno ${aluno.id}.`
            );
          }

          await client.query(
            `INSERT INTO alunos_turmas_historico
              (id, aluno_id, turma_id, ano_letivo, criado_em)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (aluno_id, ano_letivo) DO NOTHING`,
            [
              crypto.randomUUID(),
              aluno.id,
              turmaInput.turmaDestino.id,
              turmaInput.turmaDestino.anoLetivo,
              agora
            ]
          );

          await client.query(
            `INSERT INTO audit_logs
              (id, usuario_id, acao, entidade, entidade_id, metadata, criado_em)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              crypto.randomUUID(),
              actorId,
              "ALUNO_ATUALIZADO",
              "alunos",
              aluno.id,
              JSON.stringify({
                viradaAno: true,
                anoOrigem: turmaInput.turmaOrigem.anoLetivo,
                anoDestino: turmaInput.turmaDestino.anoLetivo,
                turmaAnteriorId: aluno.turmaId,
                novaTurmaId: turmaInput.turmaDestino.id
              }),
              agora
            ]
          );
        }
      }

      return turmas.map(
        (turmaInput) => turmaInput.turmaDestino
      );
    });
  }
}
