import { Router } from "express";
import type { AppConfig } from "../../shared/config.js";
import { Permissao } from "../../shared/permissions/permissions.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authenticate, authorize } from "../../shared/middlewares/auth.middleware.js";
import type { Services } from "../../shared/services.js";
import { AuditoriaController } from "./auditoria.controller.js";

export function auditoriaRoutes(services: Services, config: AppConfig): Router {
  const router = Router();
  const controller = new AuditoriaController(services);

  router.use(authenticate(config));
  router.get("/", authorize(Permissao.ACESSAR_AUDITORIA), asyncHandler(controller.list));

  return router;
}
