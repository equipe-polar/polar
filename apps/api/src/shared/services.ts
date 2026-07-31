import type { AppConfig } from "./config.js";
import { createJsonDatabase, type DatabaseClient } from "./database/database.js";
import { JsonUserRepository, type UserRepository } from "./database/repositories/user.repository.js";
import { JsonTurmaRepository, type TurmaRepository } from "./database/repositories/turma.repository.js";
import { JsonAlunoRepository, type AlunoRepository } from "./database/repositories/aluno.repository.js";
import {
  JsonOcorrenciaRepository,
  type OcorrenciaRepository
} from "./database/repositories/ocorrencia.repository.js";
import { JsonNotaRepository, type NotaRepository } from "./database/repositories/nota.repository.js";
import { JsonFaltaRepository, type FaltaRepository } from "./database/repositories/falta.repository.js";
import { JsonAuditRepository, type AuditRepository } from "./database/repositories/audit.repository.js";
import { AuthService } from "../modules/auth/auth.service.js";
import { UsersService } from "../modules/users/users.service.js";
import { TurmasService } from "../modules/turmas/turmas.service.js";
import { AlunosService } from "../modules/alunos/alunos.service.js";
import { OcorrenciasService } from "../modules/ocorrencias/ocorrencias.service.js";
import { NotasService } from "../modules/notas/notas.service.js";
import { FaltasService } from "../modules/faltas/faltas.service.js";
import { DashboardService } from "../modules/dashboard/dashboard.service.js";
import { RelatoriosService } from "../modules/relatorios/relatorios.service.js";
import { AuditoriaService } from "../modules/auditoria/auditoria.service.js";

export interface Repositories {
  users: UserRepository;
  turmas: TurmaRepository;
  alunos: AlunoRepository;
  ocorrencias: OcorrenciaRepository;
  notas: NotaRepository;
  faltas: FaltaRepository;
  audit: AuditRepository;
}

export interface Services {
  auth: AuthService;
  users: UsersService;
  turmas: TurmasService;
  alunos: AlunosService;
  ocorrencias: OcorrenciasService;
  notas: NotasService;
  faltas: FaltasService;
  dashboard: DashboardService;
  relatorios: RelatoriosService;
  auditoria: AuditoriaService;
}

export interface ServiceContainer {
  repositories: Repositories;
  services: Services;
  close(): Promise<void>;
}

export function createJsonRepositories(db: DatabaseClient): Repositories {
  return {
    users: new JsonUserRepository(db),
    turmas: new JsonTurmaRepository(db),
    alunos: new JsonAlunoRepository(db),
    ocorrencias: new JsonOcorrenciaRepository(db),
    notas: new JsonNotaRepository(db),
    faltas: new JsonFaltaRepository(db),
    audit: new JsonAuditRepository(db)
  };
}

async function createRepositories(
  config: AppConfig,
  database?: DatabaseClient
): Promise<{ repositories: Repositories; close: () => Promise<void> }> {
  if (!database && config.databaseProvider === "postgres") {
    if (!config.databaseUrl) {
      throw new Error("DATABASE_URL e obrigatorio quando DATABASE_PROVIDER=postgres.");
    }
    // Import dinamico: mantem o driver pg fora do bundle quando o provider e JSON.
    const { createPostgresPool, createPostgresRepositories } = await import("./database/postgres/index.js");
    const pool = createPostgresPool({ url: config.databaseUrl, ssl: config.databaseSsl });
    return {
      repositories: createPostgresRepositories(pool),
      close: async () => {
        await pool.end();
      }
    };
  }

  const db = database ?? createJsonDatabase(config.databaseJsonPath);
  return {
    repositories: createJsonRepositories(db),
    close: async () => {}
  };
}

export async function createServiceContainer(config: AppConfig, database?: DatabaseClient): Promise<ServiceContainer> {
  const { repositories, close } = await createRepositories(config, database);

  const auth = new AuthService(repositories.users, repositories.audit, config);
  const services: Services = {
    auth,
    users: new UsersService(repositories.users, repositories.audit),
    turmas: new TurmasService(repositories.turmas, repositories.alunos, repositories.audit),
    alunos: new AlunosService(repositories.alunos, repositories.turmas, repositories.ocorrencias, repositories.audit),
    ocorrencias: new OcorrenciasService(repositories.ocorrencias, repositories.alunos, repositories.audit),
    notas: new NotasService(repositories.notas, repositories.alunos, repositories.audit),
    faltas: new FaltasService(repositories.faltas, repositories.alunos, repositories.audit),
    dashboard: new DashboardService(repositories.ocorrencias),
    relatorios: new RelatoriosService(repositories.ocorrencias, repositories.alunos),
    auditoria: new AuditoriaService(repositories.audit)
  };

  await auth.bootstrapAdminIfNeeded();

  return {
    repositories,
    services,
    close
  };
}
