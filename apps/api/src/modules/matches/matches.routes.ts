import { Router } from "express";
import { MatchResultStatus, MatchStatus, ResultSource } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import type { AuthenticatedRequest } from "../../types.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  canParticipantAcceptResult,
  getRegistrationSide,
  isMatchModerator,
  loadMatchForAuthorization,
  loadResultForAuthorization,
  validateWinnerForScores
} from "../../utils/match-authorization.js";
import { getRequestIp } from "../../utils/request-ip.js";
import { getRequestParam } from "../../utils/request-param.js";
import { badRequest, forbidden, notFound } from "../../utils/http-error.js";
import { createAuditLog } from "../audit/audit.service.js";
import { advanceWinnerAfterMatch } from "../brackets/brackets.service.js";
import { confirmResultSchema, reportResultSchema } from "./matches.schemas.js";

export const matchesRouter = Router();

matchesRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    const matches = await prisma.match.findMany({
      include: {
        results: true,
        disputes: true
      },
      orderBy: { createdAt: "desc" }
    });

    response.json(matches);
  })
);

matchesRouter.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const matchId = getRequestParam(request.params.id);

    if (!matchId) {
      throw new Error("Match id is required");
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            game: true,
            type: true,
            format: true,
            status: true
          }
        },
        round: true,
        homeRegistration: {
          include: {
            user: { select: { id: true, username: true, displayName: true } },
            team: { select: { id: true, name: true, tag: true } }
          }
        },
        awayRegistration: {
          include: {
            user: { select: { id: true, username: true, displayName: true } },
            team: { select: { id: true, name: true, tag: true } }
          }
        },
        winnerRegistration: {
          include: {
            user: { select: { id: true, username: true, displayName: true } },
            team: { select: { id: true, name: true, tag: true } }
          }
        },
        results: {
          orderBy: { createdAt: "desc" }
        },
        disputes: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!match) {
      throw new Error("Match not found");
    }

    response.json(match);
  })
);

matchesRouter.post(
  "/:id/results",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const matchId = getRequestParam(request.params.id);
    if (!matchId) {
      throw badRequest("Match id is required");
    }
    const payload = reportResultSchema.parse(request.body);
    const match = await loadMatchForAuthorization(matchId);

    if (!match) {
      throw notFound("Match not found");
    }

    if (match.status === MatchStatus.COMPLETED || match.status === MatchStatus.CANCELLED) {
      throw badRequest("Match is locked for result reporting");
    }

    const actorSide = getRegistrationSide(match, request.user!.sub);

    if (!actorSide) {
      throw forbidden("Only captains, owners or eligible players can report this result");
    }

    if (
      !validateWinnerForScores({
        homeRegistrationId: match.homeRegistrationId,
        awayRegistrationId: match.awayRegistrationId,
        winnerRegistrationId: payload.winnerRegistrationId,
        homeScore: payload.homeScore,
        awayScore: payload.awayScore
      })
    ) {
      throw badRequest("Winner registration does not match the submitted score");
    }

    const result = await prisma.matchResult.create({
      data: {
        matchId: match.id,
        reportedByUserId: request.user!.sub,
        winnerRegistrationId: payload.winnerRegistrationId,
        homeScore: payload.homeScore,
        awayScore: payload.awayScore,
        evidenceUrls: payload.evidenceUrls,
        notes: payload.notes,
        status: MatchResultStatus.PENDING_CONFIRMATION
      }
    });

    await prisma.match.update({
      where: { id: match.id },
      data: { status: MatchStatus.RESULT_PENDING }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "match_result.report",
      entityType: "match_result",
      entityId: result.id,
      after: result,
      ipAddress: getRequestIp(request)
    });

    response.status(201).json(result);
  })
);

matchesRouter.post(
  "/results/:resultId/confirm",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const resultId = getRequestParam(request.params.resultId);
    if (!resultId) {
      throw badRequest("Match result id is required");
    }
    const payload = confirmResultSchema.parse(request.body);
    const existing = await loadResultForAuthorization(resultId);

    if (!existing) {
      throw notFound("Match result not found");
    }

    const moderator = isMatchModerator({
      userId: request.user!.sub,
      role: request.user!.role,
      organizerId: existing.match.tournament.organizerId
    });
    const actorSide = getRegistrationSide(existing.match, request.user!.sub);
    const reporterSide = getRegistrationSide(existing.match, existing.reportedByUserId);

    if (!moderator) {
      if (
        !canParticipantAcceptResult({
          actorSide,
          reporterSide,
          status: existing.status
        })
      ) {
        throw forbidden("Only the opposing captain/player or tournament staff can validate this result");
      }
    }

    const result = await prisma.matchResult.update({
      where: { id: resultId },
      data: {
        status: payload.approved ? MatchResultStatus.CONFIRMED : MatchResultStatus.REJECTED,
        confirmedByUserId: request.user!.sub,
        confirmedAt: new Date()
      }
    });

    if (payload.approved) {
      await prisma.match.update({
        where: { id: result.matchId },
        data: {
          winnerRegistrationId: result.winnerRegistrationId,
          status: MatchStatus.COMPLETED,
          resultSource: moderator ? ResultSource.ADMIN_OVERRIDE : ResultSource.MANUAL,
          resultSyncedAt: new Date()
        }
      });
      await advanceWinnerAfterMatch(result.matchId);
    } else {
      await prisma.match.update({
        where: { id: result.matchId },
        data: {
          status: MatchStatus.DISPUTED
        }
      });
    }

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: payload.approved
        ? moderator
          ? "match_result.admin_confirm"
          : "match_result.accept"
        : moderator
          ? "match_result.admin_reject"
          : "match_result.reject",
      entityType: "match_result",
      entityId: result.id,
      before: existing,
      after: result,
      ipAddress: getRequestIp(request)
    });

    response.json(result);
  })
);

matchesRouter.post(
  "/:id/report-result",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const matchId = getRequestParam(request.params.id);
    if (!matchId) {
      throw badRequest("Match id is required");
    }
    const payload = reportResultSchema.parse(request.body);
    const match = await loadMatchForAuthorization(matchId);

    if (!match) {
      throw notFound("Match not found");
    }

    if (match.status === MatchStatus.COMPLETED || match.status === MatchStatus.CANCELLED) {
      throw badRequest("Match is locked for result reporting");
    }

    const actorSide = getRegistrationSide(match, request.user!.sub);

    if (!actorSide) {
      throw forbidden("Only captains, owners or eligible players can report this result");
    }

    if (
      !validateWinnerForScores({
        homeRegistrationId: match.homeRegistrationId,
        awayRegistrationId: match.awayRegistrationId,
        winnerRegistrationId: payload.winnerRegistrationId,
        homeScore: payload.homeScore,
        awayScore: payload.awayScore
      })
    ) {
      throw badRequest("Winner registration does not match the submitted score");
    }

    const result = await prisma.matchResult.create({
      data: {
        matchId: match.id,
        reportedByUserId: request.user!.sub,
        winnerRegistrationId: payload.winnerRegistrationId,
        homeScore: payload.homeScore,
        awayScore: payload.awayScore,
        evidenceUrls: payload.evidenceUrls,
        notes: payload.notes,
        status: MatchResultStatus.PENDING_CONFIRMATION
      }
    });

    await prisma.match.update({
      where: { id: match.id },
      data: { status: MatchStatus.RESULT_PENDING }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "match_result.report",
      entityType: "match_result",
      entityId: result.id,
      after: result,
      ipAddress: getRequestIp(request)
    });

    response.status(201).json(result);
  })
);

matchesRouter.post(
  "/:id/accept-result",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const matchId = getRequestParam(request.params.id);
    if (!matchId) {
      throw badRequest("Match id is required");
    }

    const pendingResult = await prisma.matchResult.findFirst({
      where: {
        matchId,
        status: MatchResultStatus.PENDING_CONFIRMATION
      },
      orderBy: { createdAt: "desc" }
    });

    if (!pendingResult) {
      throw notFound("Pending match result not found");
    }

    request.params.resultId = pendingResult.id;
    request.body = { approved: true };

    const existing = await loadResultForAuthorization(pendingResult.id);
    if (!existing) {
      throw notFound("Match result not found");
    }

    const actorSide = getRegistrationSide(existing.match, request.user!.sub);
    const reporterSide = getRegistrationSide(existing.match, existing.reportedByUserId);

    if (
      !canParticipantAcceptResult({
        actorSide,
        reporterSide,
        status: existing.status
      })
    ) {
      throw forbidden("Only the opposing captain/player can accept this result");
    }

    const result = await prisma.matchResult.update({
      where: { id: pendingResult.id },
      data: {
        status: MatchResultStatus.CONFIRMED,
        confirmedByUserId: request.user!.sub,
        confirmedAt: new Date()
      }
    });

    await prisma.match.update({
      where: { id: result.matchId },
      data: {
        winnerRegistrationId: result.winnerRegistrationId,
        status: MatchStatus.COMPLETED,
        resultSource: ResultSource.MANUAL,
        resultSyncedAt: new Date()
      }
    });
    await advanceWinnerAfterMatch(result.matchId);

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "match_result.accept",
      entityType: "match_result",
      entityId: result.id,
      before: existing,
      after: result,
      ipAddress: getRequestIp(request)
    });

    response.json(result);
  })
);
