import { Router } from "express";
import type { AppConfig } from "../../shared/config.js";
import { Permissao } from "../../shared/permissions/permissions.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authenticate, authorize } from "../../shared/middlewares/auth.middleware.js";
import type { Services } from "../../shared/services.js";
import { NotificationsController } from "./notifications.controller.js";

export function notificationsRoutes(services: Services, config: AppConfig): Router {
  const router = Router();
  const controller = new NotificationsController(services);

  router.use(authenticate(config));
  router.get("/", authorize(Permissao.CONSULTAR_OCORRENCIAS), asyncHandler(controller.list));
  router.post("/", authorize(Permissao.GERENCIAR_NOTIFICACOES), asyncHandler(controller.create));

  return router;
}
