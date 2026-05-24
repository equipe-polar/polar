import type { Request, Response } from "express";
import { z } from "zod";
import type { Services } from "../../shared/services.js";
import { createNotaSchema } from "./notas.types.js";

const alunoParamSchema = z.object({ alunoId: z.string().min(1) });

export class NotasController {
  constructor(private readonly services: Services) {}

  create = async (req: Request, res: Response): Promise<Response> => {
    const body = createNotaSchema.parse(req.body);
    const nota = await this.services.notas.create(body, req.usuario?.id ?? "sistema");
    return res.status(201).json({ data: nota });
  };

  listByAluno = async (req: Request, res: Response): Promise<Response> => {
    const params = alunoParamSchema.parse(req.params);
    return res.json({ data: await this.services.notas.listByAluno(params.alunoId) });
  };
}
