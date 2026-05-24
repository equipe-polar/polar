import type { AuditLog } from "../../shared/domain.js";
import type { AuditRepository } from "../../shared/database/repositories/audit.repository.js";

export class AuditoriaService {
  constructor(private readonly audit: AuditRepository) {}

  async list(): Promise<AuditLog[]> {
    return this.audit.list();
  }
}
