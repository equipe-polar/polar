import { createApp } from "./app.js";
import { loadConfig } from "./shared/config.js";

const config = loadConfig();
const app = await createApp({ config });

const server = app.listen(config.port, () => {
  console.log(`POLAR API ouvindo na porta ${config.port} (provider: ${config.databaseProvider})`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`Recebido ${signal}, encerrando com seguranca...`);
  server.close(() => {
    const close = app.locals.close as (() => Promise<void>) | undefined;
    void Promise.resolve(close?.()).finally(() => {
      process.exit(0);
    });
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
