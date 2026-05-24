import { Router } from "express";
import type { AppConfig } from "../../shared/config.js";
import { Permissao } from "../../shared/permissions/permissions.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authenticate, authorize } from "../../shared/middlewares/auth.middleware.js";
import type { Services } from "../../shared/services.js";
import { DashboardController } from "./dashboard.controller.js";

export function dashboardRoutes(services: Services, config: AppConfig): Router {
  const router = Router();
  const controller = new DashboardController(services);

  router.use(authenticate(config));
  router.get("/", authorize(Permissao.CONSULTAR_OCORRENCIAS), asyncHandler(controller.resumo));
  router.get("/resumo", authorize(Permissao.CONSULTAR_OCORRENCIAS), asyncHandler(controller.resumo));

  return router;
}
