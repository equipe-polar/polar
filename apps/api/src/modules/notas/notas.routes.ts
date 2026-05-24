import { Router } from "express";
import type { AppConfig } from "../../shared/config.js";
import { Permissao } from "../../shared/permissions/permissions.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authenticate, authorize } from "../../shared/middlewares/auth.middleware.js";
import type { Services } from "../../shared/services.js";
import { NotasController } from "./notas.controller.js";

export function notasRoutes(services: Services, config: AppConfig): Router {
  const router = Router();
  const controller = new NotasController(services);

  router.use(authenticate(config));
  router.post("/", authorize(Permissao.REGISTRAR_NOTAS), asyncHandler(controller.create));
  router.get("/alunos/:alunoId", authorize(Permissao.CONSULTAR_ALUNOS), asyncHandler(controller.listByAluno));

  return router;
}
