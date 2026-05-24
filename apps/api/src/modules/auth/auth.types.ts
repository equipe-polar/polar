import type { PapelUsuario } from "../../shared/domain.js";

export interface AuthenticatedUser {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
}

export interface LoginResult {
  token: string;
  user: {
    id: string;
    nome: string;
    email: string;
    papel: PapelUsuario;
    ativo: boolean;
    precisaTrocarSenha: boolean;
    criadoEm: string;
    atualizadoEm: string;
    ultimoLoginEm: string | null;
  };
}

declare global {
  namespace Express {
    interface Request {
      usuario?: AuthenticatedUser;
    }
  }
}
