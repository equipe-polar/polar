import type { Request, Response } from "express";
import { badRequest } from "../../shared/errors/app-error.js";
import type { Services } from "../../shared/services.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";

function requireActor(req: Request): AuthenticatedUser {
  const actor = req.usuario;
  if (!actor) {
    throw badRequest("Usuario autenticado nao encontrado.");
  }
  return actor;
}

export class DashboardController {
  constructor(private readonly services: Services) {}

  resumo = async (req: Request, res: Response): Promise<Response> => {
    const actor = requireActor(req);
    return res.json({ data: await this.services.dashboard.resumo(actor) });
  };
}
