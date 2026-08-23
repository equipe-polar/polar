import { Router } from "express";
import type { AppConfig } from "../../shared/config.js";
import { Permissao } from "../../shared/permissions/permissions.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authenticate, authorize } from "../../shared/middlewares/auth.middleware.js";
import type { Services } from "../../shared/services.js";
import { OcorrenciasController } from "./ocorrencias.controller.js";

export function ocorrenciasRoutes(services: Services, config: AppConfig): Router {
  const router = Router();
  const controller = new OcorrenciasController(services);

  router.use(authenticate(config));
  router.get("/", authorize(Permissao.CONSULTAR_OCORRENCIAS), asyncHandler(controller.list));
  router.get("/:id", authorize(Permissao.CONSULTAR_OCORRENCIAS), asyncHandler(controller.get));
  router.post("/", authorize(Permissao.REGISTRAR_OCORRENCIA), asyncHandler(controller.create));
  router.patch("/:id", authorize(Permissao.REGISTRAR_OCORRENCIA), asyncHandler(controller.update));
  router.put("/:id", authorize(Permissao.REGISTRAR_OCORRENCIA), asyncHandler(controller.update));
  router.patch("/:id/status", authorize(Permissao.CONSULTAR_OCORRENCIAS), asyncHandler(controller.updateStatus));
  router.get("/:id/historico", authorize(Permissao.CONSULTAR_HISTORICO), asyncHandler(controller.historico));
  router.get("/:id/notificacoes", authorize(Permissao.CONSULTAR_HISTORICO), asyncHandler(controller.notificacoes));
  router.put("/:id/historico/:historicoId", asyncHandler(controller.bloquearEdicaoHistorico));
  router.patch("/:id/historico/:historicoId", asyncHandler(controller.bloquearEdicaoHistorico));

  return router;
}
