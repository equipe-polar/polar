import type { Request, Response } from "express";
import { z } from "zod";
import type { Services } from "../../shared/services.js";
import { createAlunoSchema, updateAlunoSchema } from "./alunos.types.js";

const idParamSchema = z.object({ id: z.string().min(1) });

export class AlunosController {
  constructor(private readonly services: Services) {}

  list = async (_req: Request, res: Response): Promise<Response> => {
    return res.json({ data: await this.services.alunos.list() });
  };

  get = async (req: Request, res: Response): Promise<Response> => {
    const params = idParamSchema.parse(req.params);
    return res.json({ data: await this.services.alunos.get(params.id) });
  };

  historicoTurmas = async (req: Request, res: Response): Promise<Response> => {
    const params = idParamSchema.parse(req.params);

    return res.json({
      data: await this.services.alunos.historicoTurmas(params.id)
    });
  };

  create = async (req: Request, res: Response): Promise<Response> => {
    const body = createAlunoSchema.parse(req.body);
    const aluno = await this.services.alunos.create(body, req.usuario?.id ?? "sistema");
    return res.status(201).json({ data: aluno });
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    const params = idParamSchema.parse(req.params);
    const body = updateAlunoSchema.parse(req.body);
    const aluno = await this.services.alunos.update(params.id, body, req.usuario?.id ?? "sistema");
    return res.json({ data: aluno });
  };

  remove = async (req: Request, res: Response): Promise<Response> => {
    const params = idParamSchema.parse(req.params);
    const aluno = await this.services.alunos.remove(params.id, req.usuario?.id ?? "sistema");
    return res.json({ data: aluno });
  };
}
