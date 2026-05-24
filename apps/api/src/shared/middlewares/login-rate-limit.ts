import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";

interface AttemptBucket {
  count: number;
  resetAt: number;
}

export function loginRateLimit(maxAttempts = 30, windowMs = 15 * 60 * 1000) {
  const attempts = new Map<string, AttemptBucket>();

  return (req: Request, _res: Response, next: NextFunction): void => {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    const bucket = attempts.get(key);

    if (!bucket || bucket.resetAt <= now) {
      attempts.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (bucket.count >= maxAttempts) {
      next(new AppError("Muitas tentativas de login. Tente novamente mais tarde.", 429, "RATE_LIMITED"));
      return;
    }

    bucket.count += 1;
    next();
  };
}
