import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { Prisma, UserRole, UserStatus, WalletTransactionType, WalletType } from "@prisma/client";
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
  adjustUserTokensSchema,
  adminUsersQuerySchema,
  auditQuerySchema,
  createAdminUserSchema,
  tokenTransactionQuerySchema,
  userActivityQuerySchema,
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

const auditModuleFilters: Record<string, Prisma.AuditLogWhereInput> = {
  auth: { OR: [{ action: { startsWith: "auth." } }, { entityType: "session" }, { entityType: "oauth" }] },
  admin: { OR: [{ action: { startsWith: "admin." } }, { entityType: "user" }] },
  tokens: { OR: [{ action: { contains: "wallet" } }, { action: { contains: "token" } }, { entityType: "wallet" }] },
  tournaments: { OR: [{ action: { contains: "tournament" } }, { entityType: "tournament" }] },
  matches: { OR: [{ action: { contains: "match" } }, { action: { contains: "dispute" } }, { entityType: "match" }, { entityType: "dispute" }] },
  riot: { OR: [{ action: { startsWith: "riot." } }, { entityType: "riot_api" }] },
  teams: { OR: [{ action: { contains: "team" } }, { entityType: "team" }] },
  spaces: { OR: [{ action: { contains: "space" } }, { entityType: "space" }] },
  system: { OR: [{ entityType: "system" }, { action: { startsWith: "system." } }] }
};

const criticalAuditFilter: Prisma.AuditLogWhereInput = {
  OR: [
    { action: { contains: "delete" } },
    { action: { contains: "cancel" } },
    { action: { contains: "reject" } },
    { action: { contains: "role" } },
    { action: { contains: "status" } },
    { action: { contains: "wallet" } },
    { action: { contains: "token" } },
    { action: { contains: "dispute" } },
    { action: { contains: "result" } },
    { action: { contains: "complete" } }
  ]
};

function inferAuditModule(action: string, entityType: string) {
  const normalized = `${action} ${entityType}`.toLowerCase();

  if (normalized.includes("wallet") || normalized.includes("token")) return "tokens";
  if (normalized.includes("tournament")) return "tournaments";
  if (normalized.includes("match") || normalized.includes("dispute")) return "matches";
  if (normalized.includes("riot")) return "riot";
  if (normalized.includes("team")) return "teams";
  if (normalized.includes("space")) return "spaces";
  if (normalized.includes("auth") || normalized.includes("login") || normalized.includes("oauth")) return "auth";
  if (normalized.includes("admin") || normalized.includes("user")) return "admin";

  return "system";
}

function inferAuditSeverity(action: string) {
  const normalized = action.toLowerCase();

  if (["delete", "cancel", "reject", "role", "status", "dispute"].some((keyword) => normalized.includes(keyword))) {
    return "critical";
  }

  if (["wallet", "token", "result", "complete", "start"].some((keyword) => normalized.includes(keyword))) {
    return "warning";
  }

  return "info";
}

function buildAuditWhere(query: z.infer<typeof auditQuerySchema>) {
  const andFilters: Prisma.AuditLogWhereInput[] = [];

  if (query.entityType) andFilters.push({ entityType: query.entityType });
  if (query.action) andFilters.push({ action: query.action });
  if (query.actorUserId) andFilters.push({ actorUserId: query.actorUserId });
  if (query.module) andFilters.push(auditModuleFilters[query.module]);
  if (query.criticalOnly) andFilters.push(criticalAuditFilter);

  if (query.from || query.to) {
    andFilters.push({
      createdAt: {
        gte: query.from,
        lte: query.to
      }
    });
  }

  if (query.q) {
    andFilters.push({
      OR: [
        { action: { contains: query.q, mode: "insensitive" } },
        { entityType: { contains: query.q, mode: "insensitive" } },
        { entityId: { contains: query.q, mode: "insensitive" } },
        {
          actorUser: {
            is: {
              OR: [
                { email: { contains: query.q, mode: "insensitive" } },
                { username: { contains: query.q, mode: "insensitive" } },
                { displayName: { contains: query.q, mode: "insensitive" } }
              ]
            }
          }
        }
      ]
    });
  }

  return andFilters.length > 0 ? { AND: andFilters } : {};
}


function serializeRegistrationActivity(registration: Prisma.TournamentRegistrationGetPayload<{
  include: {
    tournament: { select: { id: true; name: true; slug: true; game: true; status: true; startsAt: true } };
    team: { select: { id: true; name: true; tag: true } };
  };
}>) {
  return {
    id: registration.id,
    status: registration.status,
    checkedInAt: registration.checkedInAt,
    createdAt: registration.createdAt,
    updatedAt: registration.updatedAt,
    tournament: registration.tournament,
    team: registration.team
  };
}

function serializeWalletTransactionActivity(transaction: Prisma.WalletTransactionGetPayload<{
  include: {
    wallet: { select: { id: true; type: true; currencyCode: true; nonWithdrawable: true } };
    actorUser: { select: { id: true; email: true; username: true; displayName: true; role: true } };
  };
}>) {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: Number(transaction.amount),
    balanceBefore: Number(transaction.balanceBefore),
    balanceAfter: Number(transaction.balanceAfter),
    reason: transaction.reason,
    metadata: transaction.metadata,
    createdAt: transaction.createdAt,
    wallet: transaction.wallet,
    actorUser: transaction.actorUser
  };
}

function serializeMatchResultActivity(result: Prisma.MatchResultGetPayload<{
  include: {
    match: {
      select: {
        id: true;
        status: true;
        tournament: { select: { id: true; name: true; slug: true; game: true } };
        round: { select: { id: true; name: true; sequence: true } };
      };
    };
    winnerRegistration: {
      select: {
        id: true;
        user: { select: { id: true; username: true; displayName: true } };
        team: { select: { id: true; name: true; tag: true } };
      };
    };
  };
}>) {
  return {
    id: result.id,
    matchId: result.matchId,
    homeScore: result.homeScore,
    awayScore: result.awayScore,
    status: result.status,
    notes: result.notes,
    evidenceUrls: result.evidenceUrls,
    createdAt: result.createdAt,
    confirmedAt: result.confirmedAt,
    match: result.match,
    winnerRegistration: result.winnerRegistration
  };
}

function serializeDisputeActivity(dispute: Prisma.DisputeGetPayload<{
  include: {
    match: {
      select: {
        id: true;
        status: true;
        tournament: { select: { id: true; name: true; slug: true; game: true } };
        round: { select: { id: true; name: true; sequence: true } };
      };
    };
    resolvedByUser: { select: { id: true; email: true; username: true; displayName: true; role: true } };
  };
}>) {
  return {
    id: dispute.id,
    matchId: dispute.matchId,
    reason: dispute.reason,
    status: dispute.status,
    resolution: dispute.resolution,
    createdAt: dispute.createdAt,
    updatedAt: dispute.updatedAt,
    match: dispute.match,
    resolvedByUser: dispute.resolvedByUser
  };
}

function serializeAuditLog(log: Prisma.AuditLogGetPayload<{ include: { actorUser: { select: { id: true; email: true; username: true; displayName: true; role: true } } } }>) {
  return {
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    before: log.before,
    after: log.after,
    metadata: log.metadata,
    ipAddress: log.ipAddress,
    createdAt: log.createdAt,
    module: inferAuditModule(log.action, log.entityType),
    severity: inferAuditSeverity(log.action),
    actorUser: log.actorUser
  };
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


adminRouter.get(
  "/users/:id/activity",
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request, response) => {
    const userId = getRequestParam(request.params.id);

    if (!userId) {
      throw notFound("User not found");
    }

    const query = userActivityQuerySchema.parse(request.query);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
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
            nonWithdrawable: true,
            updatedAt: true
          }
        },
        _count: {
          select: {
            registrations: true,
            reportedResults: true,
            openedDisputes: true,
            walletTransactions: true,
            auditLogs: true
          }
        }
      }
    });

    if (!user) {
      throw notFound("User not found");
    }

    const [auditLogs, walletTransactions, registrations, reportedResults, openedDisputes] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          OR: [
            { actorUserId: userId },
            { entityType: "user", entityId: userId },
            { metadata: { path: ["targetUserId"], equals: userId } }
          ]
        },
        include: {
          actorUser: {
            select: { id: true, email: true, username: true, displayName: true, role: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: query.limit
      }),
      prisma.walletTransaction.findMany({
        where: {
          OR: [{ userId }, { actorUserId: userId }]
        },
        include: {
          wallet: {
            select: { id: true, type: true, currencyCode: true, nonWithdrawable: true }
          },
          actorUser: {
            select: { id: true, email: true, username: true, displayName: true, role: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: query.limit
      }),
      prisma.tournamentRegistration.findMany({
        where: { userId },
        include: {
          tournament: {
            select: { id: true, name: true, slug: true, game: true, status: true, startsAt: true }
          },
          team: {
            select: { id: true, name: true, tag: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: query.limit
      }),
      prisma.matchResult.findMany({
        where: { reportedByUserId: userId },
        include: {
          match: {
            select: {
              id: true,
              status: true,
              tournament: { select: { id: true, name: true, slug: true, game: true } },
              round: { select: { id: true, name: true, sequence: true } }
            }
          },
          winnerRegistration: {
            select: {
              id: true,
              user: { select: { id: true, username: true, displayName: true } },
              team: { select: { id: true, name: true, tag: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: query.limit
      }),
      prisma.dispute.findMany({
        where: { openedByUserId: userId },
        include: {
          match: {
            select: {
              id: true,
              status: true,
              tournament: { select: { id: true, name: true, slug: true, game: true } },
              round: { select: { id: true, name: true, sequence: true } }
            }
          },
          resolvedByUser: {
            select: { id: true, email: true, username: true, displayName: true, role: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: query.limit
      })
    ]);

    const serializedAuditLogs = auditLogs.map(serializeAuditLog);
    const currentWallet = user.wallets.find((wallet) => wallet.type === WalletType.INTERNAL_REWARD) ?? user.wallets[0] ?? null;

    response.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
        country: user.country,
        mustChangePassword: user.mustChangePassword,
        passwordChangedAt: user.passwordChangedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        wallet: currentWallet
          ? {
              ...currentWallet,
              balance: Number(currentWallet.balance)
            }
          : null
      },
      summary: {
        registrations: user._count.registrations,
        reportedResults: user._count.reportedResults,
        openedDisputes: user._count.openedDisputes,
        walletTransactions: user._count.walletTransactions,
        auditLogs: user._count.auditLogs,
        criticalAuditEvents: serializedAuditLogs.filter((log) => log.severity === "critical").length
      },
      auditLogs: serializedAuditLogs,
      walletTransactions: walletTransactions.map(serializeWalletTransactionActivity),
      registrations: registrations.map(serializeRegistrationActivity),
      reportedResults: reportedResults.map(serializeMatchResultActivity),
      openedDisputes: openedDisputes.map(serializeDisputeActivity)
    });
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
      },
      select: {
        email: true,
        username: true
      }
    });

    if (existing?.email === payload.email) {
      throw conflict("Ese correo ya esta registrado. Usa otro correo o busca el perfil existente.");
    }

    if (existing?.username === payload.username) {
      throw conflict("Ese nombre de usuario ya existe. Elige otro usuario interno.");
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
      metadata: {
        temporaryPasswordIssued: true,
        createdFrom: "admin-users-panel"
      },
      ipAddress: getRequestIp(request)
    });

    response.status(201).json({
      user,
      temporaryPassword,
      message: "Cuenta interna creada correctamente. Entrega la contrasena temporal por un canal seguro."
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
  "/wallets",
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN", "FINANCE"]),
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
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        wallets: {
          where: { type: WalletType.INTERNAL_REWARD },
          select: {
            id: true,
            type: true,
            currencyCode: true,
            balance: true,
            nonWithdrawable: true,
            updatedAt: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: query.limit
    });

    response.json(
      users.map((user) => {
        const wallet = user.wallets[0] ?? null;

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          status: user.status,
          wallet: wallet
            ? {
                ...wallet,
                balance: Number(wallet.balance)
              }
            : null
        };
      })
    );
  })
);

adminRouter.patch(
  "/users/:id/tokens",
  requireAuth,
  requireRole(["SUPER_ADMIN", "FINANCE"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = getRequestParam(request.params.id);

    if (!userId) {
      throw notFound("User not found");
    }

    if (userId === request.user!.sub) {
      throw forbidden("No puedes ajustar tus propios tokens desde el panel financiero.");
    }

    const payload = adjustUserTokensSchema.parse(request.body);

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        wallets: {
          where: { type: WalletType.INTERNAL_REWARD },
          select: {
            id: true,
            type: true,
            currencyCode: true,
            balance: true,
            nonWithdrawable: true,
            updatedAt: true
          }
        }
      }
    });

    if (!targetUser) {
      throw notFound("User not found");
    }

    const currentWallet = targetUser.wallets[0] ?? null;
    const currentBalance = Number(currentWallet?.balance ?? 0);
    const nextBalance = currentBalance + payload.amount;

    if (nextBalance < 0) {
      throw conflict("El ajuste dejaria el saldo del usuario en negativo.");
    }

    const wallet = currentWallet
      ? await prisma.wallet.update({
          where: { id: currentWallet.id },
          data: {
            balance: {
              increment: payload.amount
            }
          },
          select: {
            id: true,
            type: true,
            currencyCode: true,
            balance: true,
            nonWithdrawable: true,
            updatedAt: true
          }
        })
      : await prisma.wallet.create({
          data: {
            userId: targetUser.id,
            type: WalletType.INTERNAL_REWARD,
            currencyCode: "TOKENS",
            balance: payload.amount,
            nonWithdrawable: true
          },
          select: {
            id: true,
            type: true,
            currencyCode: true,
            balance: true,
            nonWithdrawable: true,
            updatedAt: true
          }
        });

    const finalBalance = Number(wallet.balance);

    const transaction = await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId: targetUser.id,
        actorUserId: request.user!.sub,
        type: WalletTransactionType.ADMIN_ADJUSTMENT,
        amount: payload.amount,
        balanceBefore: currentBalance,
        balanceAfter: finalBalance,
        reason: payload.reason,
        metadata: {
          source: "admin_panel",
          currencyCode: wallet.currencyCode,
          nonWithdrawable: wallet.nonWithdrawable
        }
      },
      select: {
        id: true,
        type: true,
        amount: true,
        balanceBefore: true,
        balanceAfter: true,
        reason: true,
        createdAt: true
      }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "admin.wallet.adjust",
      entityType: "wallet",
      entityId: wallet.id,
      before: {
        balance: currentBalance,
        currencyCode: wallet.currencyCode
      },
      after: {
        balance: finalBalance,
        amount: payload.amount,
        reason: payload.reason,
        currencyCode: wallet.currencyCode,
        transactionId: transaction.id
      },
      metadata: {
        targetUserId: targetUser.id,
        targetEmail: targetUser.email,
        targetUsername: targetUser.username,
        nonWithdrawable: wallet.nonWithdrawable
      },
      ipAddress: getRequestIp(request)
    });

    const result = {
      user: {
        id: targetUser.id,
        email: targetUser.email,
        username: targetUser.username,
        displayName: targetUser.displayName,
        role: targetUser.role,
        status: targetUser.status
      },
      wallet: {
        ...wallet,
        balance: finalBalance
      },
      adjustment: {
        amount: payload.amount,
        reason: payload.reason,
        previousBalance: currentBalance,
        nextBalance: finalBalance
      },
      transaction: {
        ...transaction,
        amount: Number(transaction.amount),
        balanceBefore: Number(transaction.balanceBefore),
        balanceAfter: Number(transaction.balanceAfter)
      }
    };

    response.json({
      ...result,
      message: "Ajuste de tokens registrado correctamente."
    });
  })
);



adminRouter.get(
  "/wallet-transactions",
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN", "FINANCE"]),
  asyncHandler(async (request, response) => {
    const query = tokenTransactionQuerySchema.parse(request.query);
    const where: Prisma.WalletTransactionWhereInput = {
      userId: query.userId,
      type: query.type
    };

    const transactions = await prisma.walletTransaction.findMany({
      where,
      include: {
        wallet: {
          select: {
            id: true,
            type: true,
            currencyCode: true,
            nonWithdrawable: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            role: true
          }
        },
        actorUser: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: query.limit
    });

    response.json(
      transactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        balanceBefore: Number(transaction.balanceBefore),
        balanceAfter: Number(transaction.balanceAfter),
        reason: transaction.reason,
        metadata: transaction.metadata,
        createdAt: transaction.createdAt,
        wallet: transaction.wallet,
        user: transaction.user,
        actorUser: transaction.actorUser
      }))
    );
  })
);

adminRouter.get(
  "/audit-logs",
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request, response) => {
    const query = auditQuerySchema.parse(request.query);
    const where = buildAuditWhere(query);

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        actorUser: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: query.limit
    });

    const serializedLogs = logs.map(serializeAuditLog);
    const summary = serializedLogs.reduce(
      (accumulator, log) => {
        accumulator.total += 1;
        accumulator.byModule[log.module] = (accumulator.byModule[log.module] ?? 0) + 1;
        accumulator.bySeverity[log.severity] = (accumulator.bySeverity[log.severity] ?? 0) + 1;
        return accumulator;
      },
      {
        total: 0,
        byModule: {} as Record<string, number>,
        bySeverity: {} as Record<string, number>
      }
    );

    response.json({
      logs: serializedLogs,
      summary,
      filters: {
        q: query.q ?? null,
        module: query.module ?? null,
        entityType: query.entityType ?? null,
        action: query.action ?? null,
        actorUserId: query.actorUserId ?? null,
        criticalOnly: query.criticalOnly,
        limit: query.limit
      }
    });
  })
);

adminRouter.get(
  "/audit",
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request, response) => {
    const query = auditQuerySchema.parse(request.query);
    const logs = await prisma.auditLog.findMany({
      where: buildAuditWhere(query),
      include: {
        actorUser: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: query.limit
    });

    response.json(logs.map(serializeAuditLog));
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