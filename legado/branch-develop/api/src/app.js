const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });

const routes = require("./routes");
const errorHandler = require("./middlewares/errorHandler");
const logger = require("./middlewares/logger");
const sanitizeRequest = require("./middlewares/sanitize");

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || "*";
const allowedOrigins = corsOrigin === "*"
  ? "*"
  : corsOrigin.split(",").map((origin) => origin.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (allowedOrigins === "*" || !origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origem nao permitida pelo CORS."));
  },
  credentials: true,
}));

// Entrada JSON limitada para reduzir payloads abusivos antes dos controllers.
app.use(express.json({ limit: "1mb" }));
app.use(sanitizeRequest);
app.use(logger);

app.get("/", (req, res) => {
  res.json({
    name: "P.O.L.A.R. API",
    status: "online",
    version: "1.0.0",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use(routes);

app.use((req, res) => {
  res.status(404).json({
    message: "Rota nao encontrada.",
  });
});

app.use(errorHandler);

module.exports = app;
