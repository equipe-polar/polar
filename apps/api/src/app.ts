import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
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

export interface CreateAppOptions {
  config?: AppConfig;
  database?: DatabaseClient;
}

export async function createApp(options: CreateAppOptions = {}) {
  const config = options.config ?? loadConfig();
  const container = await createServiceContainer(config, options.database);
  const app = express();
  app.locals.close = container.close;

  const allowedOrigins =
    config.corsOrigin === "*"
      ? "*"
      : config.corsOrigin
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean);

  app.use(helmet());
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

  // Em producao a propria API serve o build do frontend (1 servico, 1 URL).
  const webDist = path.resolve(process.cwd(), process.env.WEB_DIST_PATH ?? "apps/web/dist");
  const serveSpa = config.nodeEnv === "production" && fs.existsSync(webDist);

  const banner = {
    name: "POLAR API",
    status: "online",
    version: "3.0.0"
  };

  if (!serveSpa) {
    app.get("/", (_req, res) => {
      res.json(banner);
    });
  }

  app.get("/api", (_req, res) => {
    res.json(banner);
  });

  // Health check em dois enderecos: /api/health acompanha o prefixo da API,
  // /health continua respondendo para plataformas que sondam a raiz.
  const health = (_req: express.Request, res: express.Response): void => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString()
    });
  };
  app.get("/health", health);
  app.get("/api/health", health);

  // Toda a API vive sob /api: roteamento de CDN e por caminho, entao o prefixo e o
  // que permite servir o SPA estaticamente sem disputar caminho com a API.
  app.use("/api/auth", authRoutes(container.services, config));
  app.use("/api/usuarios", usersRoutes(container.services, config));
  app.use("/api/turmas", turmasRoutes(container.services, config));
  app.use("/api/alunos", alunosRoutes(container.services, config));
  app.use("/api/ocorrencias", ocorrenciasRoutes(container.services, config));
  app.use("/api/notas", notasRoutes(container.services, config));
  app.use("/api/faltas", faltasRoutes(container.services, config));
  app.use("/api/dashboard", dashboardRoutes(container.services, config));
  app.use("/api/relatorios", relatoriosRoutes(container.services, config));
  app.use("/api/auditoria", auditoriaRoutes(container.services, config));

  if (serveSpa) {
    app.use(express.static(webDist));

    // Qualquer outro GET de navegacao devolve o index.html, para que um F5 em
    // /ocorrencias/:id abra o React. Caminhos /api ja foram tratados acima e,
    // se chegarem aqui, sao 404 de API -- devem responder JSON, nao HTML.
    app.use((req, res, next) => {
      if (req.method === "GET" && !req.path.startsWith("/api")) {
        res.sendFile(path.join(webDist, "index.html"));
        return;
      }
      next();
    });
  }

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
