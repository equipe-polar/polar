import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

// Estes caminhos sao derivados deste modulo, e nao do cwd. O pnpm executa os
// scripts de um workspace a partir de apps/api, enquanto seed e builds podem
// partir da raiz do repositorio.
const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const repositoryRoot = path.resolve(apiRoot, "../..");

// dotenv nao sobrescreve variaveis ja definidas, entao valores explicitamente
// fornecidos pelo ambiente continuam tendo precedencia.
dotenv.config({ path: path.resolve(repositoryRoot, ".env"), quiet: true });
dotenv.config({ path: path.resolve(apiRoot, ".env"), quiet: true });

const configSchema = z.object({
  nodeEnv: z.string().default("development"),
  port: z.coerce.number().int().positive().default(3000),
  corsOrigin: z.string().default("http://localhost:5173"),
  jwtSecret: z.string().min(32, "JWT_SECRET deve ter pelo menos 32 caracteres."),
  jwtExpiresIn: z.string().default("8h"),
  databaseProvider: z.enum(["json", "postgres"]).default("json"),
  databaseJsonPath: z.string().default("apps/api/data/dev-db.json"),
  databaseUrl: z.string().optional(),
  databaseSsl: z
    .string()
    .optional()
    .transform((value) => value === "true" || value === "1"),
  bootstrapAdminEmail: z.string().email().default("admin@pola.local"),
  bootstrapAdminPassword: z.string().optional()
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = configSchema.parse({
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    corsOrigin: env.CORS_ORIGIN,
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    databaseProvider: env.DATABASE_PROVIDER,
    databaseJsonPath: env.DATABASE_JSON_PATH,
    databaseUrl: env.DATABASE_URL,
    databaseSsl: env.DATABASE_SSL,
    bootstrapAdminEmail: env.BOOTSTRAP_ADMIN_EMAIL,
    bootstrapAdminPassword: env.BOOTSTRAP_ADMIN_PASSWORD
  });

  // O seed resolve DATABASE_JSON_PATH a partir da raiz. Sem esta normalizacao,
  // `pnpm dev` (cujo cwd e apps/api) abria apps/api/apps/api/data/dev-db.json:
  // um banco vazio diferente daquele que acabou de receber o seed.
  const config: AppConfig = {
    ...parsed,
    databaseJsonPath: path.isAbsolute(parsed.databaseJsonPath)
      ? parsed.databaseJsonPath
      : path.resolve(repositoryRoot, parsed.databaseJsonPath)
  };

  if (config.databaseProvider === "postgres" && !config.databaseUrl) {
    throw new Error("DATABASE_URL e obrigatorio quando DATABASE_PROVIDER=postgres.");
  }

  if (config.nodeEnv === "production" && config.databaseProvider !== "postgres") {
    throw new Error("Producao exige DATABASE_PROVIDER=postgres. Persistencia JSON e apenas para desenvolvimento.");
  }

  if (config.nodeEnv === "production" && config.bootstrapAdminPassword === "admin123") {
    throw new Error("BOOTSTRAP_ADMIN_PASSWORD inseguro em producao.");
  }

  return config;
}
