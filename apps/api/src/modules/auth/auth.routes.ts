import { Router } from "express";
import type { AppConfig } from "../../shared/config.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { loginRateLimit } from "../../shared/middlewares/login-rate-limit.js";
import type { Services } from "../../shared/services.js";
import { AuthController } from "./auth.controller.js";

export function authRoutes(services: Services, config: AppConfig): Router {
  const router = Router();
  const controller = new AuthController(services);

  router.post("/login", loginRateLimit(), asyncHandler(controller.login));
  router.get("/me", authenticate(config), asyncHandler(controller.me));
  router.post("/alterar-senha", authenticate(config), asyncHandler(controller.alterarSenha));

  return router;
}
