import type { Request, Response } from "express";
import { z } from "zod";
import { badRequest } from "../../shared/errors/app-error.js";
import type { Services } from "../../shared/services.js";
import { createOcorrenciaSchema, updateOcorrenciaSchema, updateStatusSchema } from "./ocorrencias.types.js";

const idParamSchema = z.object({ id: z.string().min(1) });

export class OcorrenciasController {
  constructor(private readonly services: Services) {}

  list = async (_req: Request, res: Response): Promise<Response> => {
    return res.json({ data: await this.services.ocorrencias.list() });
  };

  get = async (req: Request, res: Response): Promise<Response> => {
    const params = idParamSchema.parse(req.params);
    return res.json({ data: await this.services.ocorrencias.get(params.id) });
  };

  create = async (req: Request, res: Response): Promise<Response> => {
    const actor = req.usuario;
    if (!actor) {
      throw badRequest("Usuario autenticado nao encontrado.");
    }

    const body = createOcorrenciaSchema.parse(req.body);
    const ocorrencia = await this.services.ocorrencias.create(body, actor);
    return res.status(201).json({ data: ocorrencia });
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    const actor = req.usuario;
    if (!actor) {
      throw badRequest("Usuario autenticado nao encontrado.");
    }

    const params = idParamSchema.parse(req.params);
    const body = updateOcorrenciaSchema.parse(req.body);
    const ocorrencia = await this.services.ocorrencias.update(params.id, body, actor);
    return res.json({ data: ocorrencia });
  };

  updateStatus = async (req: Request, res: Response): Promise<Response> => {
    const actor = req.usuario;
    if (!actor) {
      throw badRequest("Usuario autenticado nao encontrado.");
    }

    const params = idParamSchema.parse(req.params);
    const body = updateStatusSchema.parse(req.body);
    const ocorrencia = await this.services.ocorrencias.updateStatus(params.id, body.status, actor);
    return res.json({ data: ocorrencia });
  };

  historico = async (req: Request, res: Response): Promise<Response> => {
    const params = idParamSchema.parse(req.params);
    return res.json({ data: await this.services.ocorrencias.historico(params.id) });
  };

  bloquearEdicaoHistorico = async (_req: Request, res: Response): Promise<Response> => {
    return res.status(405).json({
      error: {
        code: "HISTORICO_IMUTAVEL",
        message: "Historico de ocorrencia nao pode ser editado manualmente."
      }
    });
  };
}
