import type { Pool, RowDataPacket } from "mysql2/promise";
import type { Notification } from "../../domain.js";
import type { NotificationRepository } from "../repositories/notification.repository.js";
import { boolFromDb, dbBool, dbDateTime, isoFromDbRequired } from "./mysql-client.js";

interface NotificationRow extends RowDataPacket {
  id: string;
  titulo: string;
  mensagem: string;
  destinatario_id: string | null;
  ocorrencia_id: string | null;
  lida: number;
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
    lida: boolFromDb(row.lida),
    criadoPorId: row.criado_por_id,
    criadoEm: isoFromDbRequired(row.criado_em)
  };
}

const COLUNAS = "id, titulo, mensagem, destinatario_id, ocorrencia_id, lida, criado_por_id, criado_em";

export class MysqlNotificationRepository implements NotificationRepository {
  constructor(private readonly pool: Pool) {}

  async list(): Promise<Notification[]> {
    const [rows] = await this.pool.query<NotificationRow[]>(
      `SELECT ${COLUNAS} FROM notifications ORDER BY criado_em DESC`
    );
    return rows.map(toNotification);
  }

  async create(notification: Notification): Promise<Notification> {
    await this.pool.execute(`INSERT INTO notifications (${COLUNAS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
      notification.id,
      notification.titulo,
      notification.mensagem,
      notification.destinatarioId,
      notification.ocorrenciaId,
      dbBool(notification.lida),
      notification.criadoPorId,
      dbDateTime(notification.criadoEm)
    ]);
    return notification;
  }
}
