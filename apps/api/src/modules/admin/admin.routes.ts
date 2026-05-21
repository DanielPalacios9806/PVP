import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import type { AuthenticatedRequest } from "../../types.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { forbidden, notFound } from "../../utils/http-error.js";
import { getRequestIp } from "../../utils/request-ip.js";
import { getRequestParam } from "../../utils/request-param.js";
import { createAuditLog } from "../audit/audit.service.js";
import { auditQuerySchema, updateUserRoleSchema } from "./admin.schemas.js";

export const adminRouter = Router();

adminRouter.get(
  "/users",
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (_request, response) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        country: true,
        createdAt: true,
        updatedAt: true,
        wallets: {
          select: {
            id: true,
            type: true,
            currencyCode: true,
            balance: true,
            nonWithdrawable: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 200
    });

    response.json(users);
  })
);

adminRouter.patch(
  "/users/:id/role",
  requireAuth,
  requireRole(["SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = getRequestParam(request.params.id);
    const payload = updateUserRoleSchema.parse(request.body);

    if (userId === request.user!.sub && payload.role !== "SUPER_ADMIN") {
      throw forbidden("Super admin users cannot remove their own super admin role");
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });

    if (!existing) {
      throw notFound("User not found");
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: payload.role },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        updatedAt: true
      }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "admin.user_role.update",
      entityType: "user",
      entityId: user.id,
      before: { role: existing.role },
      after: { role: user.role },
      ipAddress: getRequestIp(request)
    });

    response.json(user);
  })
);

adminRouter.get(
  "/audit-logs",
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN", "MODERATOR"]),
  asyncHandler(async (request, response) => {
    const query = auditQuerySchema.parse(request.query);
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType: query.entityType,
        action: query.action
      },
      include: {
        actorUser: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: query.limit
    });

    response.json(logs);
  })
);

adminRouter.get(
  "/audit",
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN", "MODERATOR"]),
  asyncHandler(async (request, response) => {
    const query = auditQuerySchema.parse(request.query);
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType: query.entityType,
        action: query.action
      },
      include: {
        actorUser: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: query.limit
    });

    response.json(logs);
  })
);

adminRouter.get(
  "/riot-status",
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN", "MODERATOR", "ORGANIZER"]),
  asyncHandler(async (_request, response) => {
    response.json({
      mode: process.env.RIOT_MODE ?? "mock",
      apiKeyConfigured: Boolean(process.env.RIOT_API_KEY),
      platform: process.env.RIOT_PLATFORM ?? "LA1",
      region: process.env.RIOT_REGION ?? "AMERICAS",
      callbackUrlConfigured: Boolean(process.env.RIOT_CALLBACK_URL)
    });
  })
);
