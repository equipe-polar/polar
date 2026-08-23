import type { Request, Response } from "express";
import { z } from "zod";
import type { Services } from "../../shared/services.js";

const idParamSchema = z.object({ id: z.string().min(1) });
const filtroOcorrenciasSchema = z.object({
  turmaId: z.string().min(1).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional()
});

export class RelatoriosController {
  constructor(private readonly services: Services) {}

  ocorrencias = async (req: Request, res: Response): Promise<Response> => {
    const entrada = filtroOcorrenciasSchema.parse(req.query);
    const filtro = {
      ...(entrada.turmaId ? { turmaId: entrada.turmaId } : {}),
      ...(entrada.dataInicio ? { dataInicio: entrada.dataInicio } : {}),
      ...(entrada.dataFim ? { dataFim: entrada.dataFim } : {})
    };
    return res.json({ data: await this.services.relatorios.ocorrenciasResumo(filtro) });
  };

  aluno = async (req: Request, res: Response): Promise<Response> => {
    const params = idParamSchema.parse(req.params);
    return res.json({ data: await this.services.relatorios.aluno(params.id) });
  };
}
