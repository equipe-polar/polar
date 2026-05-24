import type { Request, Response } from "express";
import { z } from "zod";
import type { Services } from "../../shared/services.js";
import { createFaltaSchema } from "./faltas.types.js";

const alunoParamSchema = z.object({ alunoId: z.string().min(1) });

export class FaltasController {
  constructor(private readonly services: Services) {}

  create = async (req: Request, res: Response): Promise<Response> => {
    const body = createFaltaSchema.parse(req.body);
    const falta = await this.services.faltas.create(body, req.usuario?.id ?? "sistema");
    return res.status(201).json({ data: falta });
  };

  listByAluno = async (req: Request, res: Response): Promise<Response> => {
    const params = alunoParamSchema.parse(req.params);
    return res.json({ data: await this.services.faltas.listByAluno(params.alunoId) });
  };
}
