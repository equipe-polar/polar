import { Router } from "express";
import type { AppConfig } from "../../shared/config.js";
import { Permissao } from "../../shared/permissions/permissions.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authenticate, authorize } from "../../shared/middlewares/auth.middleware.js";
import type { Services } from "../../shared/services.js";
import { UsersController } from "./users.controller.js";

export function usersRoutes(services: Services, config: AppConfig): Router {
  const router = Router();
  const controller = new UsersController(services);

  router.use(authenticate(config));
  router.get("/", authorize(Permissao.GERENCIAR_USUARIOS), asyncHandler(controller.list));
  router.post("/", authorize(Permissao.GERENCIAR_USUARIOS), asyncHandler(controller.create));
  router.patch("/:id", authorize(Permissao.GERENCIAR_USUARIOS), asyncHandler(controller.update));

  return router;
}
