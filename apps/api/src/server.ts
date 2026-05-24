import { createApp } from "./app.js";
import { loadConfig } from "./shared/config.js";

const config = loadConfig();
const app = await createApp({ config });

app.listen(config.port, () => {
  console.log(`P.O.L.A API ouvindo na porta ${config.port}`);
});
