export type UserRole = "PROFESSOR" | "COORDENADOR" | "DIRETOR" | "ADM";

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  papel: UserRole;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
