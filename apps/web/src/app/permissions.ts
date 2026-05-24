import type { UserRole } from "../features/auth/auth.types";

export type Permission =
  | "dashboard:view"
  | "ocorrencias:view"
  | "ocorrencias:create"
  | "ocorrencias:status:analise"
  | "ocorrencias:status:resolver"
  | "ocorrencias:status:encerrar"
  | "alunos:view"
  | "alunos:manage"
  | "turmas:view"
  | "turmas:manage"
  | "usuarios:manage"
  | "relatorios:view"
  | "configuracoes:manage";

const rolePermissions: Record<UserRole, Permission[]> = {
  PROFESSOR: ["dashboard:view", "ocorrencias:view", "ocorrencias:create", "alunos:view"],
  COORDENADOR: [
    "dashboard:view",
    "ocorrencias:view",
    "ocorrencias:status:analise",
    "ocorrencias:status:resolver",
    "alunos:view",
    "turmas:view",
    "relatorios:view"
  ],
  DIRETOR: ["dashboard:view", "ocorrencias:view", "ocorrencias:status:encerrar", "relatorios:view"],
  ADM: [
    "dashboard:view",
    "ocorrencias:view",
    "ocorrencias:create",
    "alunos:view",
    "alunos:manage",
    "turmas:view",
    "turmas:manage",
    "usuarios:manage",
    "relatorios:view",
    "configuracoes:manage"
  ]
};

export function canAccess(userRole: UserRole | undefined, permission: Permission): boolean {
  if (!userRole) return false;
  return rolePermissions[userRole].includes(permission);
}
