import type { NextFunction, Request, Response } from "express";

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message?: string;
  keyPrefix?: string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

function resolveIp(request: Request) {
  const forwarded = request.headers["x-forwarded-for"];

  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]?.trim() ?? request.ip ?? "unknown";
  }

  return request.ip ?? "unknown";
}

function cleanupExpiredEntries(now: number) {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function createRateLimiter(options: RateLimitOptions) {
  return (request: Request, response: Response, next: NextFunction) => {
    const now = Date.now();
    const routePath = request.route?.path ?? request.path;
    const key = `${options.keyPrefix ?? "default"}:${resolveIp(request)}:${request.method}:${routePath}`;
    const current = store.get(key);

    if (store.size > 10_000) {
      cleanupExpiredEntries(now);
    }

    response.setHeader("X-RateLimit-Limit", options.max.toString());

    if (!current || current.resetAt <= now) {
      store.set(key, {
        count: 1,
        resetAt: now + options.windowMs
      });
      response.setHeader("X-RateLimit-Remaining", Math.max(0, options.max - 1).toString());
      return next();
    }

    const remaining = Math.max(0, options.max - current.count - 1);
    response.setHeader("X-RateLimit-Remaining", remaining.toString());

    if (current.count >= options.max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      response.setHeader("Retry-After", retryAfterSeconds.toString());
      return response.status(429).json({
        message: options.message ?? "Demasiadas solicitudes. Intenta nuevamente en unos minutos."
      });
    }

    current.count += 1;
    store.set(key, current);
    return next();
  };
}
