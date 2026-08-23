import type { Pool } from "pg";
import type { NotificacaoOcorrencia } from "../../domain.js";
import type { NotificacaoOcorrenciaRepository } from "../repositories/notificacao-ocorrencia.repository.js";
import { dbDateTime, isoFromDbRequired, withTransaction } from "./postgres-client.js";

interface NotificacaoRow {
  id: string;
  ocorrencia_id: string;
  destinatario: NotificacaoOcorrencia["destinatario"];
  resultado: "ENVIADO";
  criado_em: Date;
}

function toNotificacao(row: NotificacaoRow): NotificacaoOcorrencia {
  return {
    id: row.id,
    ocorrenciaId: row.ocorrencia_id,
    destinatario: row.destinatario,
    resultado: row.resultado,
    criadoEm: isoFromDbRequired(row.criado_em)
  };
}

export class PostgresNotificacaoOcorrenciaRepository implements NotificacaoOcorrenciaRepository {
  constructor(private readonly pool: Pool) {}

  async createMany(notificacoes: NotificacaoOcorrencia[]): Promise<void> {
    if (notificacoes.length === 0) return;

    await withTransaction(this.pool, async (client) => {
      for (const notificacao of notificacoes) {
        await client.query(
          `INSERT INTO notificacoes_ocorrencia
            (id, ocorrencia_id, destinatario, resultado, criado_em)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            notificacao.id,
            notificacao.ocorrenciaId,
            notificacao.destinatario,
            notificacao.resultado,
            dbDateTime(notificacao.criadoEm)
          ]
        );
      }
    });
  }

  async listByOcorrencia(ocorrenciaId: string): Promise<NotificacaoOcorrencia[]> {
    const { rows } = await this.pool.query<NotificacaoRow>(
      `SELECT id, ocorrencia_id, destinatario, resultado, criado_em
       FROM notificacoes_ocorrencia
       WHERE ocorrencia_id = $1
       ORDER BY criado_em`,
      [ocorrenciaId]
    );
    return rows.map(toNotificacao);
  }
}
