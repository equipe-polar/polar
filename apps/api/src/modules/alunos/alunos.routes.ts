import { Router } from "express";
import type { AppConfig } from "../../shared/config.js";
import { Permissao } from "../../shared/permissions/permissions.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authenticate, authorize } from "../../shared/middlewares/auth.middleware.js";
import type { Services } from "../../shared/services.js";
import { AlunosController } from "./alunos.controller.js";

export function alunosRoutes(services: Services, config: AppConfig): Router {
  const router = Router();
  const controller = new AlunosController(services);

  router.use(authenticate(config));
  router.get("/", authorize(Permissao.CONSULTAR_ALUNOS), asyncHandler(controller.list));
  router.get("/:id/historico-turmas", authorize(Permissao.CONSULTAR_ALUNOS), asyncHandler(controller.historicoTurmas));
  router.get("/:id", authorize(Permissao.CONSULTAR_ALUNOS), asyncHandler(controller.get));
  router.post("/", authorize(Permissao.GERENCIAR_ALUNOS), asyncHandler(controller.create));
  router.patch("/:id", authorize(Permissao.GERENCIAR_ALUNOS), asyncHandler(controller.update));
  router.delete("/:id", authorize(Permissao.GERENCIAR_ALUNOS), asyncHandler(controller.remove));

  return router;
}
