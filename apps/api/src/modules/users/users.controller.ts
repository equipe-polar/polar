import type { Request, Response } from "express";
import { z } from "zod";
import { badRequest } from "../../shared/errors/app-error.js";
import type { Services } from "../../shared/services.js";
import { createUserSchema, updateUserSchema } from "./users.types.js";

const idParamSchema = z.object({ id: z.string().min(1) });

export class UsersController {
  constructor(private readonly services: Services) {}

  list = async (_req: Request, res: Response): Promise<Response> => {
    return res.json({ data: await this.services.users.list() });
  };

  create = async (req: Request, res: Response): Promise<Response> => {
    const actor = req.usuario;
    if (!actor) {
      throw badRequest("Usuario autenticado nao encontrado.");
    }

    const body = createUserSchema.parse(req.body);
    const user = await this.services.users.create(body, actor.id);
    return res.status(201).json({ data: user });
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    const actor = req.usuario;
    const params = idParamSchema.parse(req.params);
    const body = updateUserSchema.parse(req.body);
    const user = await this.services.users.update(params.id, body, actor?.id ?? "sistema");
    return res.json({ data: user });
  };
}
