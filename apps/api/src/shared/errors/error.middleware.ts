import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "./app-error.js";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Entrada invalida.",
        details: error.flatten()
      }
    });
  }

  if (error instanceof AppError) {
    const payload: { error: { code: string; message: string; details?: unknown } } = {
      error: {
        code: error.code,
        message: error.message
      }
    };

    if (error.details !== null) {
      payload.error.details = error.details;
    }

    return res.status(error.statusCode).json(payload);
  }

  console.error("Erro nao tratado:", error);
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Erro interno inesperado."
    }
  });
};
