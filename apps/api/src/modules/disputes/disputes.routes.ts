import { Router } from "express";
import { MatchStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import type { AuthenticatedRequest } from "../../types.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { getRegistrationSide, isMatchModerator, loadMatchForAuthorization } from "../../utils/match-authorization.js";
import { getRequestIp } from "../../utils/request-ip.js";
import { getRequestParam } from "../../utils/request-param.js";
import { forbidden, notFound } from "../../utils/http-error.js";
import { createAuditLog } from "../audit/audit.service.js";
import { disputeSchema, resolveDisputeSchema } from "./disputes.schemas.js";

export const disputesRouter = Router();

disputesRouter.get(
  "/",
  requireAuth,
  requireRole(["MODERATOR", "ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (_request, response) => {
    const disputes = await prisma.dispute.findMany({
      include: { match: true },
      orderBy: { createdAt: "desc" }
    });

    response.json(disputes);
  })
);

disputesRouter.post(
  "/matches/:matchId",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const matchId = getRequestParam(request.params.matchId);
    if (!matchId) {
      throw notFound("Match id is required");
    }
    const payload = disputeSchema.parse(request.body);
    const match = await loadMatchForAuthorization(matchId);

    if (!match) {
      throw notFound("Match not found");
    }

    const actorSide = getRegistrationSide(match, request.user!.sub);
    const moderator = isMatchModerator({
      userId: request.user!.sub,
      role: request.user!.role,
      organizerId: match.tournament.organizerId
    });

    if (!actorSide && !moderator) {
      throw forbidden("Only tournament participants or staff can open disputes");
    }

    const dispute = await prisma.dispute.create({
      data: {
        matchId: match.id,
        openedByUserId: request.user!.sub,
        reason: payload.reason
      }
    });

    await prisma.match.update({
      where: { id: match.id },
      data: { status: MatchStatus.DISPUTED }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "dispute.open",
      entityType: "dispute",
      entityId: dispute.id,
      after: dispute,
      ipAddress: getRequestIp(request)
    });

    response.status(201).json(dispute);
  })
);

disputesRouter.post(
  "/:id/resolve",
  requireAuth,
  requireRole(["MODERATOR", "ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const disputeId = getRequestParam(request.params.id);
    const payload = resolveDisputeSchema.parse(request.body);
    const existing = await prisma.dispute.findUnique({ where: { id: disputeId } });

    if (!existing) {
      throw new Error("Dispute not found");
    }

    const dispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: payload.status,
        resolution: payload.resolution,
        resolvedByUserId: request.user!.sub
      }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "dispute.resolve",
      entityType: "dispute",
      entityId: dispute.id,
      before: existing,
      after: dispute,
      ipAddress: getRequestIp(request)
    });

    response.json(dispute);
  })
);
