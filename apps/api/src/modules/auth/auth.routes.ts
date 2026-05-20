import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import { createRateLimiter } from "../../middlewares/rate-limit.js";
import type { AuthenticatedRequest } from "../../types.js";
import { getAuthProfile } from "../../utils/auth-profile.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { getRequestIp } from "../../utils/request-ip.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { loginUser, registerUser } from "./auth.service.js";
import { createAuditLog } from "../audit/audit.service.js";

export const authRouter = Router();
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts. Please try again later."
});

authRouter.post(
  "/register",
  authRateLimiter,
  asyncHandler(async (request, response) => {
    const payload = registerSchema.parse(request.body);
    const user = await registerUser({
      ...payload,
      ipAddress: getRequestIp(request)
    });

    response.status(201).json({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role
    });
  })
);

authRouter.post(
  "/login",
  authRateLimiter,
  asyncHandler(async (request, response) => {
    const payload = loginSchema.parse(request.body);
    const result = await loginUser({
      ...payload,
      ipAddress: getRequestIp(request)
    });

    response.json(result);
  })
);

authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.sub },
      select: { id: true }
    });

    if (user) {
      await createAuditLog({
        actorUserId: user.id,
        action: "auth.logout",
        entityType: "user",
        entityId: user.id,
        ipAddress: getRequestIp(request)
      });
    }

    response.status(204).send();
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const profile = await getAuthProfile(request.user!.sub);
    response.json(profile);
  })
);
