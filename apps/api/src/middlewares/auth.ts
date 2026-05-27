import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { UserStatus } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest, AuthUser } from "../types.js";

export async function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return response.status(401).json({ message: "Unauthorized" });
  }

  const token = header.replace("Bearer ", "");

  let decoded: AuthUser;

  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
  } catch {
    return response.status(401).json({ message: "Invalid token" });
  }

  if (!decoded.sub) {
    return response.status(401).json({ message: "Invalid token" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        role: true,
        status: true
      }
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      return response.status(401).json({ message: "Invalid session" });
    }

    request.user = {
      ...decoded,
      sub: user.id,
      email: user.email,
      role: user.role
    };

    return next();
  } catch (error) {
    return next(error);
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
