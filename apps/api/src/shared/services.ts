import type { AppConfig } from "./config.js";
import { createJsonDatabase, type DatabaseClient } from "./database/database.js";
import { UserRepository } from "./database/repositories/user.repository.js";
import { TurmaRepository } from "./database/repositories/turma.repository.js";
import { AlunoRepository } from "./database/repositories/aluno.repository.js";
import { OcorrenciaRepository } from "./database/repositories/ocorrencia.repository.js";
import { NotaRepository } from "./database/repositories/nota.repository.js";
import { FaltaRepository } from "./database/repositories/falta.repository.js";
import { AuditRepository } from "./database/repositories/audit.repository.js";
import { NotificationRepository } from "./database/repositories/notification.repository.js";
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
import { NotificationsService } from "../modules/notifications/notifications.service.js";

export interface Repositories {
  users: UserRepository;
  turmas: TurmaRepository;
  alunos: AlunoRepository;
  ocorrencias: OcorrenciaRepository;
  notas: NotaRepository;
  faltas: FaltaRepository;
  audit: AuditRepository;
  notifications: NotificationRepository;
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
  notifications: NotificationsService;
}

export interface ServiceContainer {
  db: DatabaseClient;
  repositories: Repositories;
  services: Services;
}

export async function createServiceContainer(config: AppConfig, database?: DatabaseClient): Promise<ServiceContainer> {
  const db = database ?? createJsonDatabase(config.databaseJsonPath);
  const repositories: Repositories = {
    users: new UserRepository(db),
    turmas: new TurmaRepository(db),
    alunos: new AlunoRepository(db),
    ocorrencias: new OcorrenciaRepository(db),
    notas: new NotaRepository(db),
    faltas: new FaltaRepository(db),
    audit: new AuditRepository(db),
    notifications: new NotificationRepository(db)
  };

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
    auditoria: new AuditoriaService(repositories.audit),
    notifications: new NotificationsService(repositories.notifications, repositories.audit)
  };

  await auth.bootstrapAdminIfNeeded();

  return {
    db,
    repositories,
    services
  };
}
