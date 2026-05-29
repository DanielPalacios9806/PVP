import { Router } from "express";
import { DisputeStatus, MatchResultStatus, MatchStatus, ResultSource } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
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
import { confirmResultSchema, createDisputeSchema, reportResultSchema, resolveDisputeSchema } from "./matches.schemas.js";


async function completeMatchWithResult(params: {
  resultId: string;
  actorUserId: string;
  source: ResultSource;
}) {
  const result = await prisma.matchResult.update({
    where: { id: params.resultId },
    data: {
      status: MatchResultStatus.CONFIRMED,
      confirmedByUserId: params.actorUserId,
      confirmedAt: new Date()
    }
  });

  await prisma.match.update({
    where: { id: result.matchId },
    data: {
      winnerRegistrationId: result.winnerRegistrationId,
      status: MatchStatus.COMPLETED,
      resultSource: params.source,
      resultSyncedAt: new Date()
    }
  });

  await advanceWinnerAfterMatch(result.matchId);

  return result;
}

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
  "/moderation/cases",
  requireAuth,
  requireRole(["MODERATOR", "ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request, response) => {
    const statusFilter = typeof request.query.status === "string" ? request.query.status : "all";
    const tournamentId = typeof request.query.tournamentId === "string" ? request.query.tournamentId : "";
    const query = typeof request.query.q === "string" ? request.query.q.trim() : "";
    const parsedLimit = Number(typeof request.query.limit === "string" ? request.query.limit : "50");
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 10), 100) : 50;

    const baseWhere = (() => {
      switch (statusFilter) {
        case "pending":
          return {
            OR: [
              { status: MatchStatus.RESULT_PENDING },
              { results: { some: { status: MatchResultStatus.PENDING_CONFIRMATION } } }
            ]
          };
        case "disputed":
          return {
            OR: [
              { status: MatchStatus.DISPUTED },
              { disputes: { some: { status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] } } } }
            ]
          };
        case "completed":
          return { status: MatchStatus.COMPLETED };
        case "open":
          return { status: { in: [MatchStatus.READY, MatchStatus.IN_PROGRESS, MatchStatus.RESULT_PENDING, MatchStatus.DISPUTED] } };
        default:
          return {
            OR: [
              { status: { in: [MatchStatus.RESULT_PENDING, MatchStatus.DISPUTED, MatchStatus.IN_PROGRESS, MatchStatus.READY] } },
              { results: { some: { status: MatchResultStatus.PENDING_CONFIRMATION } } },
              { disputes: { some: { status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] } } } }
            ]
          };
      }
    })();

    const matches = await prisma.match.findMany({
      where: {
        AND: [
          baseWhere,
          tournamentId ? { tournamentId } : {},
          query
            ? {
                OR: [
                  { tournament: { name: { contains: query } } },
                  { tournament: { game: { contains: query } } },
                  { homeRegistration: { team: { name: { contains: query } } } },
                  { awayRegistration: { team: { name: { contains: query } } } },
                  { homeRegistration: { user: { username: { contains: query } } } },
                  { awayRegistration: { user: { username: { contains: query } } } },
                  { homeRegistration: { user: { displayName: { contains: query } } } },
                  { awayRegistration: { user: { displayName: { contains: query } } } }
                ]
              }
            : {}
        ]
      },
      take: limit,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      include: {
        tournament: { select: { id: true, name: true, game: true, status: true, organizerId: true } },
        round: { select: { id: true, name: true } },
        homeRegistration: {
          include: {
            user: { select: { id: true, username: true, displayName: true, email: true } },
            team: { select: { id: true, name: true, tag: true } }
          }
        },
        awayRegistration: {
          include: {
            user: { select: { id: true, username: true, displayName: true, email: true } },
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
          orderBy: { createdAt: "desc" },
          include: {
            reportedByUser: { select: { id: true, username: true, displayName: true, email: true } },
            confirmedByUser: { select: { id: true, username: true, displayName: true } },
            winnerRegistration: {
              include: {
                user: { select: { id: true, username: true, displayName: true } },
                team: { select: { id: true, name: true, tag: true } }
              }
            }
          }
        },
        disputes: {
          orderBy: { createdAt: "desc" },
          include: {
            openedByUser: { select: { id: true, username: true, displayName: true, email: true } },
            resolvedByUser: { select: { id: true, username: true, displayName: true } }
          }
        }
      }
    });

    const cases = matches.map((match) => {
      const pendingResult = match.results.find((result) => result.status === MatchResultStatus.PENDING_CONFIRMATION) ?? null;
      const openDispute = match.disputes.find((dispute) => dispute.status === DisputeStatus.OPEN || dispute.status === DisputeStatus.UNDER_REVIEW) ?? null;
      const severity = openDispute ? "critical" : pendingResult ? "warning" : match.status === MatchStatus.IN_PROGRESS ? "info" : "neutral";
      const actionNeeded = openDispute
        ? "Resolver disputa"
        : pendingResult
          ? "Validar resultado pendiente"
          : match.status === MatchStatus.READY
            ? "Esperando reporte"
            : match.status === MatchStatus.IN_PROGRESS
              ? "Monitorear partida"
              : match.status === MatchStatus.COMPLETED
                ? "Caso cerrado"
                : "Revisar estado";

      return {
        id: match.id,
        status: match.status,
        scheduledAt: match.scheduledAt,
        updatedAt: match.updatedAt,
        tournament: match.tournament,
        round: match.round,
        homeRegistration: match.homeRegistration,
        awayRegistration: match.awayRegistration,
        winnerRegistration: match.winnerRegistration,
        pendingResult,
        openDispute,
        latestResult: match.results[0] ?? null,
        latestDispute: match.disputes[0] ?? null,
        resultsCount: match.results.length,
        disputesCount: match.disputes.length,
        severity,
        actionNeeded
      };
    });

    response.json({
      cases,
      summary: {
        total: cases.length,
        pendingResults: cases.filter((item) => item.pendingResult).length,
        openDisputes: cases.filter((item) => item.openDispute).length,
        inProgress: cases.filter((item) => item.status === MatchStatus.IN_PROGRESS).length,
        completed: cases.filter((item) => item.status === MatchStatus.COMPLETED).length
      }
    });
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
          orderBy: { createdAt: "desc" },
          include: {
            reportedByUser: { select: { id: true, username: true, displayName: true } },
            confirmedByUser: { select: { id: true, username: true, displayName: true } },
            winnerRegistration: {
              include: {
                user: { select: { id: true, username: true, displayName: true } },
                team: { select: { id: true, name: true, tag: true } }
              }
            }
          }
        },
        disputes: {
          orderBy: { createdAt: "desc" },
          include: {
            openedByUser: { select: { id: true, username: true, displayName: true } },
            resolvedByUser: { select: { id: true, username: true, displayName: true } }
          }
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
      await completeMatchWithResult({
        resultId: result.id,
        actorUserId: request.user!.sub,
        source: moderator ? ResultSource.ADMIN_OVERRIDE : ResultSource.MANUAL
      });
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

    await completeMatchWithResult({
      resultId: result.id,
      actorUserId: request.user!.sub,
      source: ResultSource.MANUAL
    });

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

matchesRouter.post(
  "/:id/disputes",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const matchId = getRequestParam(request.params.id);
    if (!matchId) {
      throw badRequest("Match id is required");
    }

    const payload = createDisputeSchema.parse(request.body);
    const match = await loadMatchForAuthorization(matchId);

    if (!match) {
      throw notFound("Match not found");
    }

    if (match.status === MatchStatus.COMPLETED || match.status === MatchStatus.CANCELLED) {
      throw badRequest("Match is locked for disputes");
    }

    const moderator = isMatchModerator({
      userId: request.user!.sub,
      role: request.user!.role,
      organizerId: match.tournament.organizerId
    });
    const actorSide = getRegistrationSide(match, request.user!.sub);

    if (!moderator && !actorSide) {
      throw forbidden("Only match participants or tournament staff can open a dispute");
    }

    const existingOpenDispute = await prisma.dispute.findFirst({
      where: {
        matchId: match.id,
        status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] }
      }
    });

    if (existingOpenDispute) {
      throw badRequest("This match already has an open dispute");
    }

    const dispute = await prisma.dispute.create({
      data: {
        matchId: match.id,
        openedByUserId: request.user!.sub,
        reason: payload.reason,
        status: DisputeStatus.OPEN
      }
    });

    await prisma.match.update({
      where: { id: match.id },
      data: { status: MatchStatus.DISPUTED }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "match_dispute.open",
      entityType: "dispute",
      entityId: dispute.id,
      after: dispute,
      ipAddress: getRequestIp(request)
    });

    response.status(201).json(dispute);
  })
);

matchesRouter.post(
  "/disputes/:disputeId/resolve",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const disputeId = getRequestParam(request.params.disputeId);
    if (!disputeId) {
      throw badRequest("Dispute id is required");
    }

    const payload = resolveDisputeSchema.parse(request.body);
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        match: {
          include: {
            tournament: { select: { organizerId: true } },
            results: {
              where: { status: MatchResultStatus.PENDING_CONFIRMATION },
              orderBy: { createdAt: "desc" }
            }
          }
        }
      }
    });

    if (!dispute) {
      throw notFound("Dispute not found");
    }

    const moderator = isMatchModerator({
      userId: request.user!.sub,
      role: request.user!.role,
      organizerId: dispute.match.tournament.organizerId
    });

    if (!moderator) {
      throw forbidden("Only tournament staff can resolve disputes");
    }

    if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.REJECTED) {
      throw badRequest("Dispute is already closed");
    }

    let resolvedResult = null;
    const selectedResultId = payload.approvedResultId ?? dispute.match.results[0]?.id;

    if (selectedResultId && payload.approved === true) {
      const selectedResult = dispute.match.results.find((result) => result.id === selectedResultId);
      if (!selectedResult) {
        throw badRequest("Selected result is not pending for this match");
      }

      resolvedResult = await completeMatchWithResult({
        resultId: selectedResult.id,
        actorUserId: request.user!.sub,
        source: ResultSource.ADMIN_OVERRIDE
      });

      await prisma.matchResult.updateMany({
        where: {
          matchId: dispute.matchId,
          id: { not: selectedResult.id },
          status: MatchResultStatus.PENDING_CONFIRMATION
        },
        data: { status: MatchResultStatus.REJECTED }
      });
    } else if (payload.approved === false) {
      await prisma.matchResult.updateMany({
        where: {
          matchId: dispute.matchId,
          status: MatchResultStatus.PENDING_CONFIRMATION
        },
        data: {
          status: MatchResultStatus.REJECTED,
          confirmedByUserId: request.user!.sub,
          confirmedAt: new Date()
        }
      });

      await prisma.match.update({
        where: { id: dispute.matchId },
        data: { status: MatchStatus.READY }
      });
    } else {
      await prisma.match.update({
        where: { id: dispute.matchId },
        data: { status: MatchStatus.READY }
      });
    }

    const resolvedDispute = await prisma.dispute.update({
      where: { id: dispute.id },
      data: {
        status: DisputeStatus.RESOLVED,
        resolution: payload.resolution,
        resolvedByUserId: request.user!.sub
      }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "match_dispute.resolve",
      entityType: "dispute",
      entityId: resolvedDispute.id,
      before: dispute,
      after: { dispute: resolvedDispute, result: resolvedResult },
      ipAddress: getRequestIp(request)
    });

    response.json({ dispute: resolvedDispute, result: resolvedResult });
  })
);


