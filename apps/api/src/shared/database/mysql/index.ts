import type { Pool } from "mysql2/promise";
import type { Repositories } from "../../services.js";
import { MysqlUserRepository } from "./user.repository.mysql.js";
import { MysqlTurmaRepository } from "./turma.repository.mysql.js";
import { MysqlAlunoRepository } from "./aluno.repository.mysql.js";
import { MysqlOcorrenciaRepository } from "./ocorrencia.repository.mysql.js";
import { MysqlNotaRepository } from "./nota.repository.mysql.js";
import { MysqlFaltaRepository } from "./falta.repository.mysql.js";
import { MysqlAuditRepository } from "./audit.repository.mysql.js";
import { MysqlNotificationRepository } from "./notification.repository.mysql.js";

export { createMysqlPool, withTransaction } from "./mysql-client.js";

export function createMysqlRepositories(pool: Pool): Repositories {
  return {
    users: new MysqlUserRepository(pool),
    turmas: new MysqlTurmaRepository(pool),
    alunos: new MysqlAlunoRepository(pool),
    ocorrencias: new MysqlOcorrenciaRepository(pool),
    notas: new MysqlNotaRepository(pool),
    faltas: new MysqlFaltaRepository(pool),
    audit: new MysqlAuditRepository(pool),
    notifications: new MysqlNotificationRepository(pool)
  };
}
