import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), "apps/api/.env"), quiet: true });

const configSchema = z.object({
  nodeEnv: z.string().default("development"),
  port: z.coerce.number().int().positive().default(3000),
  corsOrigin: z.string().default("http://localhost:3000"),
  jwtSecret: z.string().min(32, "JWT_SECRET deve ter pelo menos 32 caracteres."),
  jwtExpiresIn: z.string().default("8h"),
  databaseProvider: z.enum(["json"]).default("json"),
  databaseJsonPath: z.string().default("apps/api/data/dev-db.json"),
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
    bootstrapAdminEmail: env.BOOTSTRAP_ADMIN_EMAIL,
    bootstrapAdminPassword: env.BOOTSTRAP_ADMIN_PASSWORD
  });

  if (parsed.nodeEnv === "production" && parsed.bootstrapAdminPassword === "admin123") {
    throw new Error("BOOTSTRAP_ADMIN_PASSWORD inseguro em producao.");
  }

  return parsed;
}
