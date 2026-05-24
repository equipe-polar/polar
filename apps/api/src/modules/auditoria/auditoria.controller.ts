import type { Request, Response } from "express";
import type { Services } from "../../shared/services.js";

export class AuditoriaController {
  constructor(private readonly services: Services) {}

  list = async (_req: Request, res: Response): Promise<Response> => {
    return res.json({ data: await this.services.auditoria.list() });
  };
}
