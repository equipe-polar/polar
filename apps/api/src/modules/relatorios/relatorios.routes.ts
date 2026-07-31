import { Router } from "express";
import type { AppConfig } from "../../shared/config.js";
import { Permissao } from "../../shared/permissions/permissions.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authenticate, authorize } from "../../shared/middlewares/auth.middleware.js";
import type { Services } from "../../shared/services.js";
import { RelatoriosController } from "./relatorios.controller.js";

export function relatoriosRoutes(services: Services, config: AppConfig): Router {
  const router = Router();
  const controller = new RelatoriosController(services);

  router.use(authenticate(config));
  router.get("/ocorrencias", authorize(Permissao.CONSULTAR_RELATORIOS), asyncHandler(controller.ocorrencias));
  router.get("/alunos/:id", authorize(Permissao.CONSULTAR_RELATORIOS), asyncHandler(controller.aluno));

  return router;
}
