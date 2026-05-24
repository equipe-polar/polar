import type { Request, Response } from "express";
import { z } from "zod";
import type { Services } from "../../shared/services.js";

const idParamSchema = z.object({ id: z.string().min(1) });

export class RelatoriosController {
  constructor(private readonly services: Services) {}

  ocorrencias = async (_req: Request, res: Response): Promise<Response> => {
    return res.json({ data: await this.services.relatorios.ocorrenciasResumo() });
  };

  aluno = async (req: Request, res: Response): Promise<Response> => {
    const params = idParamSchema.parse(req.params);
    return res.json({ data: await this.services.relatorios.aluno(params.id) });
  };
}
