import type { Pool, PoolClient } from "pg";
import type { AuditLog } from "../../domain.js";
import type { AuditRepository } from "../repositories/audit.repository.js";
import { dbDateTime, isoFromDbRequired } from "./postgres-client.js";

interface AuditRow {
  id: string;
  usuario_id: string | null;
  acao: string;
  entidade: string;
  entidade_id: string | null;
  // JSONB ja volta desserializado; nao ha JSON.parse defensivo aqui.
  metadata: Record<string, unknown>;
  criado_em: Date;
}

function toAuditLog(row: AuditRow): AuditLog {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    acao: row.acao,
    entidade: row.entidade,
    entidadeId: row.entidade_id,
    metadata: row.metadata,
    criadoEm: isoFromDbRequired(row.criado_em)
  };
}

const COLUNAS = "id, usuario_id, acao, entidade, entidade_id, metadata, criado_em";

export class PostgresAuditRepository implements AuditRepository {
  constructor(private readonly pool: Pool) {}

  async list(): Promise<AuditLog[]> {
    const { rows } = await this.pool.query<AuditRow>(`SELECT ${COLUNAS} FROM audit_logs ORDER BY criado_em DESC`);
    return rows.map(toAuditLog);
  }

  async createWithClient(
    client: PoolClient,
    log: AuditLog
  ): Promise<AuditLog> {
    await client.query(
      `INSERT INTO audit_logs (${COLUNAS})
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        log.id,
        log.usuarioId,
        log.acao,
        log.entidade,
        log.entidadeId,
        JSON.stringify(log.metadata ?? {}),
        dbDateTime(log.criadoEm)
      ]
    );

    return log;
  }

  async create(log: AuditLog): Promise<AuditLog> {
    await this.pool.query(`INSERT INTO audit_logs (${COLUNAS}) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
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
