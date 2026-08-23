import type { Request, Response } from "express";
import { z } from "zod";
import type { Services } from "../../shared/services.js";
import type { CopiarAnoInput } from "./turmas.service.js";
import { createTurmaSchema, updateTurmaSchema, copiarAnoSchema} from "./turmas.types.js";

const idParamSchema = z.object({ id: z.string().min(1) });

export class TurmasController {
  constructor(private readonly services: Services) {}

  list = async (_req: Request, res: Response): Promise<Response> => {
    return res.json({ data: await this.services.turmas.list() });
  };

  create = async (req: Request, res: Response): Promise<Response> => {
    const body = createTurmaSchema.parse(req.body);
    const turma = await this.services.turmas.create(body, req.usuario?.id ?? "sistema");
    return res.status(201).json({ data: turma });
  };

  copiarAno = async (req: Request, res: Response): Promise<Response> => {
    const body = copiarAnoSchema.parse(req.body);
    const input: CopiarAnoInput = {
      ...body,
      turmas: body.turmas.map(({ tipoEnsino, ...turma }) =>
        tipoEnsino ? { ...turma, tipoEnsino } : turma
      )
    };

    const turmas = await this.services.turmas.copiarAno(
      input,
      req.usuario?.id ?? "sistema"
    );

    return res.status(201).json({ data: turmas });
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    const params = idParamSchema.parse(req.params);
    const body = updateTurmaSchema.parse(req.body);
    const turma = await this.services.turmas.update(params.id, body, req.usuario?.id ?? "sistema");
    return res.json({ data: turma });
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    const params = idParamSchema.parse(req.params);
    await this.services.turmas.delete(params.id, req.usuario?.id ?? "sistema");
    return res.status(204).send();
  };
}
