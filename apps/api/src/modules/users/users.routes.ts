import { WalletType } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { getAuthProfile } from "../../utils/auth-profile.js";
import { getRequestIp } from "../../utils/request-ip.js";
import type { AuthenticatedRequest } from "../../types.js";
import { requestUserDeletion, executeUserDeletion } from "./users.service.js";
import { createAuditLog } from "../audit/audit.service.js";

export const usersRouter = Router();

usersRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const user = await getAuthProfile(request.user!.sub);

    response.json(user);
  })
);

usersRouter.get(
  "/me/tokens/history",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const limit = z.coerce.number().int().min(1).max(100).default(25).parse(request.query.limit);
    const transactions = await prisma.walletTransaction.findMany({
      where: {
        userId: request.user!.sub,
        wallet: {
          type: WalletType.INTERNAL_REWARD
        }
      },
      include: {
        wallet: {
          select: {
            id: true,
            type: true,
            currencyCode: true,
            nonWithdrawable: true
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
      take: limit
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
        actorUser: transaction.actorUser
      }))
    );
  })
);

usersRouter.post(
  "/me/request-deletion",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = request.user!.sub;
    const ipAddress = getRequestIp(request);

    const result = await requestUserDeletion({
      userId,
      ipAddress
    });

    await createAuditLog({
      actorUserId: userId,
      action: "user.deletion_requested",
      entityType: "user",
      entityId: userId,
      metadata: {
        email: result.email,
        scheduledForDeletion: result.scheduledForDeletion
      },
      ipAddress
    });

    response.json({
      message: "Solicitud de eliminación enviada. Tu cuenta será eliminada en 30 días. Revisa tu correo para confirmar.",
      scheduledForDeletion: result.scheduledForDeletion
    });
  })
);

usersRouter.delete(
  "/me",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = request.user!.sub;
    const ipAddress = getRequestIp(request);

    const result = await executeUserDeletion({
      userId,
      ipAddress
    });

    await createAuditLog({
      actorUserId: userId,
      action: "user.deleted",
      entityType: "user",
      entityId: userId,
      metadata: {
        email: result.previousEmail,
        deletionExecuted: new Date().toISOString()
      },
      ipAddress
    });

    response.json({
      message: "Tu cuenta ha sido eliminada correctamente. Todos tus datos personales han sido removidos.",
      deletedAt: new Date().toISOString()
    });
  })
);
