import { Router } from "express";
import type { AppConfig } from "../../shared/config.js";
import { Permissao } from "../../shared/permissions/permissions.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authenticate, authorize } from "../../shared/middlewares/auth.middleware.js";
import type { Services } from "../../shared/services.js";
import { TurmasController } from "./turmas.controller.js";

export function turmasRoutes(services: Services, config: AppConfig): Router {
  const router = Router();
  const controller = new TurmasController(services);

  router.use(authenticate(config));
  router.get("/", authorize(Permissao.CONSULTAR_ALUNOS), asyncHandler(controller.list));
  router.post("/", authorize(Permissao.GERENCIAR_TURMAS), asyncHandler(controller.create));
  router.post("/copiar-ano", authorize(Permissao.GERENCIAR_TURMAS), asyncHandler(controller.copiarAno));
  router.patch("/:id", authorize(Permissao.GERENCIAR_TURMAS), asyncHandler(controller.update));
  router.delete("/:id", authorize(Permissao.GERENCIAR_TURMAS), asyncHandler(controller.delete));

  return router;
}
