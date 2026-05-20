import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthenticatedRequest, AuthUser } from "../types.js";

export function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return response.status(401).json({ message: "Unauthorized" });
  }

  const token = header.replace("Bearer ", "");

  try {
    request.user = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    return next();
  } catch {
    return response.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(roles: string[]) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    if (!request.user) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(request.user.role)) {
      return response.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}
