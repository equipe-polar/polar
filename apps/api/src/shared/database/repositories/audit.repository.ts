import type { DatabaseClient } from "../database.js";
import type { AuditLog } from "../../domain.js";

export class AuditRepository {
  constructor(private readonly db: DatabaseClient) {}

  async list(): Promise<AuditLog[]> {
    const state = await this.db.read();
    return state.auditLogs;
  }

  async create(log: AuditLog): Promise<AuditLog> {
    return this.db.transaction((state) => {
      state.auditLogs.push(log);
      return log;
    });
  }
}
