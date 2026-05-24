import { Router } from "express";
import type { AppConfig } from "../../shared/config.js";
import { Permissao } from "../../shared/permissions/permissions.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authenticate, authorize } from "../../shared/middlewares/auth.middleware.js";
import type { Services } from "../../shared/services.js";
import { FaltasController } from "./faltas.controller.js";

export function faltasRoutes(services: Services, config: AppConfig): Router {
  const router = Router();
  const controller = new FaltasController(services);

  router.use(authenticate(config));
  router.post("/", authorize(Permissao.REGISTRAR_FALTAS), asyncHandler(controller.create));
  router.get("/alunos/:alunoId", authorize(Permissao.CONSULTAR_ALUNOS), asyncHandler(controller.listByAluno));

  return router;
}
