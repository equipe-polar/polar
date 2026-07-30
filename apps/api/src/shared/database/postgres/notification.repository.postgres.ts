import type { Pool } from "pg";
import type { Notification } from "../../domain.js";
import type { NotificationRepository } from "../repositories/notification.repository.js";
import { dbDateTime, isoFromDbRequired } from "./postgres-client.js";

interface NotificationRow {
  id: string;
  titulo: string;
  mensagem: string;
  destinatario_id: string | null;
  ocorrencia_id: string | null;
  lida: boolean;
  criado_por_id: string;
  criado_em: Date;
}

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    titulo: row.titulo,
    mensagem: row.mensagem,
    destinatarioId: row.destinatario_id,
    ocorrenciaId: row.ocorrencia_id,
    lida: row.lida,
    criadoPorId: row.criado_por_id,
    criadoEm: isoFromDbRequired(row.criado_em)
  };
}

const COLUNAS = "id, titulo, mensagem, destinatario_id, ocorrencia_id, lida, criado_por_id, criado_em";

export class PostgresNotificationRepository implements NotificationRepository {
  constructor(private readonly pool: Pool) {}

  async list(): Promise<Notification[]> {
    const { rows } = await this.pool.query<NotificationRow>(
      `SELECT ${COLUNAS} FROM notifications ORDER BY criado_em DESC`
    );
    return rows.map(toNotification);
  }

  async create(notification: Notification): Promise<Notification> {
    await this.pool.query(`INSERT INTO notifications (${COLUNAS}) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
      notification.id,
      notification.titulo,
      notification.mensagem,
      notification.destinatarioId,
      notification.ocorrenciaId,
      notification.lida,
      notification.criadoPorId,
      dbDateTime(notification.criadoEm)
    ]);
    return notification;
  }
}
