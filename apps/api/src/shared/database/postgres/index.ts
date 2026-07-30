import type { Pool } from "pg";
import type { Repositories } from "../../services.js";
import { PostgresUserRepository } from "./user.repository.postgres.js";
import { PostgresTurmaRepository } from "./turma.repository.postgres.js";
import { PostgresAlunoRepository } from "./aluno.repository.postgres.js";
import { PostgresOcorrenciaRepository } from "./ocorrencia.repository.postgres.js";
import { PostgresNotaRepository } from "./nota.repository.postgres.js";
import { PostgresFaltaRepository } from "./falta.repository.postgres.js";
import { PostgresAuditRepository } from "./audit.repository.postgres.js";
import { PostgresNotificationRepository } from "./notification.repository.postgres.js";

export { createPostgresPool, withTransaction } from "./postgres-client.js";

export function createPostgresRepositories(pool: Pool): Repositories {
  return {
    users: new PostgresUserRepository(pool),
    turmas: new PostgresTurmaRepository(pool),
    alunos: new PostgresAlunoRepository(pool),
    ocorrencias: new PostgresOcorrenciaRepository(pool),
    notas: new PostgresNotaRepository(pool),
    faltas: new PostgresFaltaRepository(pool),
    audit: new PostgresAuditRepository(pool),
    notifications: new PostgresNotificationRepository(pool)
  };
}
