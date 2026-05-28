import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { Prisma, UserRole, UserStatus, WalletType } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import type { AuthenticatedRequest } from "../../types.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { conflict, forbidden, notFound } from "../../utils/http-error.js";
import { getRequestIp } from "../../utils/request-ip.js";
import { getRequestParam } from "../../utils/request-param.js";
import { createAuditLog } from "../audit/audit.service.js";
import { getRiotRuntimeConfig } from "../riot/riot.client.js";
import { getRiotAdminOverview, testRiotConnection } from "../riot/riot.service.js";
import {
  adminUsersQuerySchema,
  auditQuerySchema,
  createAdminUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema
} from "./admin.schemas.js";

export const adminRouter = Router();

const adminUserSelect = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  role: true,
  status: true,
  country: true,
  mustChangePassword: true,
  passwordChangedAt: true,
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
} satisfies Prisma.UserSelect;

function createTemporaryPassword() {
  return `Ds-${randomBytes(9).toString("base64url")}!9aA`;
}

async function ensureAnotherActiveSuperAdmin(userId: string) {
  const otherSuperAdmins = await prisma.user.count({
    where: {
      id: { not: userId },
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE
    }
  });

  if (otherSuperAdmins === 0) {
    throw forbidden("Debe existir al menos otro SUPER_ADMIN activo antes de cambiar este perfil.");
  }
}

adminRouter.get(
  "/users",
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request, response) => {
    const query = adminUsersQuerySchema.parse(request.query);
    const where: Prisma.UserWhereInput = {
      role: query.role,
      status: query.status
    };

    if (query.q) {
      where.OR = [
        { email: { contains: query.q, mode: "insensitive" } },
        { username: { contains: query.q, mode: "insensitive" } },
        { displayName: { contains: query.q, mode: "insensitive" } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: adminUserSelect,
      orderBy: { createdAt: "desc" },
      take: query.limit
    });

    response.json(users);
  })
);

adminRouter.post(
  "/users",
  requireAuth,
  requireRole(["SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const payload = createAdminUserSchema.parse(request.body);
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: payload.email }, { username: payload.username }]
      }
    });

    if (existing) {
      throw conflict("Email or username already exists");
    }

    const temporaryPassword = createTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const user = await prisma.user.create({
      data: {
        email: payload.email,
        username: payload.username,
        displayName: payload.displayName,
        passwordHash,
        role: payload.role,
        status: payload.status,
        mustChangePassword: true,
        wallets: {
          create: {
            type: WalletType.INTERNAL_REWARD,
            currencyCode: "TOKENS",
            balance: 100,
            nonWithdrawable: true
          }
        }
      },
      select: adminUserSelect
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "admin.user.create",
      entityType: "user",
      entityId: user.id,
      after: {
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        mustChangePassword: user.mustChangePassword
      },
      ipAddress: getRequestIp(request)
    });

    response.status(201).json({
      user,
      temporaryPassword
    });
  })
);

adminRouter.patch(
  "/users/:id/role",
  requireAuth,
  requireRole(["SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = getRequestParam(request.params.id);

    if (!userId) {
      throw notFound("User not found");
    }

    const payload = updateUserRoleSchema.parse(request.body);

    if (userId === request.user!.sub && payload.role !== UserRole.SUPER_ADMIN) {
      throw forbidden("Super admin users cannot remove their own super admin role");
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existing) {
      throw notFound("User not found");
    }

    if (existing.role === UserRole.SUPER_ADMIN && payload.role !== UserRole.SUPER_ADMIN) {
      await ensureAnotherActiveSuperAdmin(userId);
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

adminRouter.patch(
  "/users/:id/status",
  requireAuth,
  requireRole(["SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = getRequestParam(request.params.id);

    if (!userId) {
      throw notFound("User not found");
    }

    const payload = updateUserStatusSchema.parse(request.body);

    if (userId === request.user!.sub && payload.status !== UserStatus.ACTIVE) {
      throw forbidden("Super admin users cannot suspend or deactivate their own account");
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existing) {
      throw notFound("User not found");
    }

    if (existing.role === UserRole.SUPER_ADMIN && payload.status !== UserStatus.ACTIVE) {
      await ensureAnotherActiveSuperAdmin(userId);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: payload.status },
      select: adminUserSelect
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "admin.user_status.update",
      entityType: "user",
      entityId: user.id,
      before: { status: existing.status },
      after: { status: user.status },
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
    response.json(getRiotRuntimeConfig());
  })
);

adminRouter.get(
  "/riot/overview",
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN", "MODERATOR"]),
  asyncHandler(async (_request, response) => {
    const overview = await getRiotAdminOverview();
    response.json(overview);
  })
);

adminRouter.get(
  "/riot/logs",
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN", "MODERATOR"]),
  asyncHandler(async (request, response) => {
    const limit = z.coerce.number().int().min(1).max(100).default(50).parse(request.query.limit);
    const logs = await prisma.riotApiLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit
    });

    response.json(logs);
  })
);

adminRouter.post(
  "/riot/test-connection",
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const payload = z
      .object({
        gameName: z.string().trim().min(2).max(32).optional(),
        tagLine: z.string().trim().min(2).max(16).optional()
      })
      .parse(request.body ?? {});

    const result = await testRiotConnection({
      ...payload,
      userId: request.user!.sub
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "riot.admin.test_connection",
      entityType: "riot_api",
      after: {
        ok: result.ok,
        skippedExternalRequest: result.skippedExternalRequest,
        mode: result.config.mode
      },
      ipAddress: getRequestIp(request)
    });

    response.json(result);
  })
);