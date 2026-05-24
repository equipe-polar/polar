import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { AppConfig } from "../config.js";
import { PapelUsuario } from "../domain.js";
import { forbidden, unauthorized } from "../errors/app-error.js";
import { type Permissao, possuiPermissao } from "../permissions/permissions.js";
import type { AuthenticatedUser } from "../../modules/auth/auth.types.js";

interface JwtPayload {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
}

function isJwtPayload(value: unknown): value is JwtPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Partial<JwtPayload>;
  return (
    typeof payload.id === "string" &&
    typeof payload.nome === "string" &&
    typeof payload.email === "string" &&
    Object.values(PapelUsuario).includes(payload.papel as PapelUsuario)
  );
}

export function authenticate(config: AppConfig) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      next(unauthorized("Token JWT ausente."));
      return;
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret, { issuer: "pola-api" });
      if (!isJwtPayload(decoded)) {
        next(unauthorized("Token JWT invalido."));
        return;
      }

      req.usuario = decoded satisfies AuthenticatedUser;
      next();
    } catch {
      next(unauthorized("Token JWT invalido ou expirado."));
    }
  };
}

export function authorize(...permissoes: Permissao[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const usuario = req.usuario;
    if (!usuario) {
      next(unauthorized());
      return;
    }

    const autorizado = permissoes.some((permissao) => possuiPermissao(usuario.papel, permissao));
    if (!autorizado) {
      next(forbidden());
      return;
    }

    next();
  };
}
