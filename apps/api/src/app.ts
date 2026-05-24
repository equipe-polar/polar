import express from "express";
import cors from "cors";
import type { AppConfig } from "./shared/config.js";
import { loadConfig } from "./shared/config.js";
import type { DatabaseClient } from "./shared/database/database.js";
import { createServiceContainer } from "./shared/services.js";
import { errorMiddleware } from "./shared/errors/error.middleware.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { turmasRoutes } from "./modules/turmas/turmas.routes.js";
import { alunosRoutes } from "./modules/alunos/alunos.routes.js";
import { ocorrenciasRoutes } from "./modules/ocorrencias/ocorrencias.routes.js";
import { notasRoutes } from "./modules/notas/notas.routes.js";
import { faltasRoutes } from "./modules/faltas/faltas.routes.js";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import { relatoriosRoutes } from "./modules/relatorios/relatorios.routes.js";
import { auditoriaRoutes } from "./modules/auditoria/auditoria.routes.js";
import { notificationsRoutes } from "./modules/notifications/notifications.routes.js";

export interface CreateAppOptions {
  config?: AppConfig;
  database?: DatabaseClient;
}

export async function createApp(options: CreateAppOptions = {}) {
  const config = options.config ?? loadConfig();
  const container = await createServiceContainer(config, options.database);
  const app = express();

  const allowedOrigins =
    config.corsOrigin === "*"
      ? "*"
      : config.corsOrigin
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (allowedOrigins === "*" || !origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Origem nao permitida pelo CORS."));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/", (_req, res) => {
    res.json({
      name: "P.O.L.A API",
      status: "online",
      version: "2.0.0"
    });
  });

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString()
    });
  });

  app.use("/auth", authRoutes(container.services, config));
  app.use("/usuarios", usersRoutes(container.services, config));
  app.use("/users", usersRoutes(container.services, config));
  app.use("/turmas", turmasRoutes(container.services, config));
  app.use("/alunos", alunosRoutes(container.services, config));
  app.use("/students", alunosRoutes(container.services, config));
  app.use("/ocorrencias", ocorrenciasRoutes(container.services, config));
  app.use("/occurrences", ocorrenciasRoutes(container.services, config));
  app.use("/notas", notasRoutes(container.services, config));
  app.use("/faltas", faltasRoutes(container.services, config));
  app.use("/dashboard", dashboardRoutes(container.services, config));
  app.use("/relatorios", relatoriosRoutes(container.services, config));
  app.use("/reports", relatoriosRoutes(container.services, config));
  app.use("/auditoria", auditoriaRoutes(container.services, config));
  app.use("/notificacoes", notificationsRoutes(container.services, config));
  app.use("/notifications", notificationsRoutes(container.services, config));

  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Rota nao encontrada."
      }
    });
  });

  app.use(errorMiddleware);
  return app;
}
