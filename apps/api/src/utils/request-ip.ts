import type { Request } from "express";

export function getRequestIp(request: Request) {
  const forwarded = request.headers["x-forwarded-for"];

  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim();
  }

  return request.ip;
}
