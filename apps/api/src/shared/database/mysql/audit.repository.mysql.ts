import type { Pool, RowDataPacket } from "mysql2/promise";
import type { AuditLog } from "../../domain.js";
import type { AuditRepository } from "../repositories/audit.repository.js";
import { dbDateTime, isoFromDbRequired } from "./mysql-client.js";

interface AuditRow extends RowDataPacket {
  id: string;
  usuario_id: string | null;
  acao: string;
  entidade: string;
  entidade_id: string | null;
  metadata: Record<string, unknown> | string;
  criado_em: Date;
}

function toAuditLog(row: AuditRow): AuditLog {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    acao: row.acao,
    entidade: row.entidade,
    entidadeId: row.entidade_id,
    metadata: typeof row.metadata === "string" ? (JSON.parse(row.metadata) as Record<string, unknown>) : row.metadata,
    criadoEm: isoFromDbRequired(row.criado_em)
  };
}

const COLUNAS = "id, usuario_id, acao, entidade, entidade_id, metadata, criado_em";

export class MysqlAuditRepository implements AuditRepository {
  constructor(private readonly pool: Pool) {}

  async list(): Promise<AuditLog[]> {
    const [rows] = await this.pool.query<AuditRow[]>(`SELECT ${COLUNAS} FROM audit_logs ORDER BY criado_em DESC`);
    return rows.map(toAuditLog);
  }

  async create(log: AuditLog): Promise<AuditLog> {
    await this.pool.execute(`INSERT INTO audit_logs (${COLUNAS}) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
      log.id,
      log.usuarioId,
      log.acao,
      log.entidade,
      log.entidadeId,
      JSON.stringify(log.metadata ?? {}),
      dbDateTime(log.criadoEm)
    ]);
    return log;
  }
}
