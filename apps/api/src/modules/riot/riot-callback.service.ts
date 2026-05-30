import { MatchResultStatus, MatchStatus, ResultSource, RiotCallbackStatus, RiotTournamentCodeStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { AuthUser } from "../../types.js";
import { badRequest, forbidden } from "../../utils/http-error.js";
import { parseRiotCallbackMetadata, verifyRiotCallbackMetadata } from "./riot-callback-signature.js";
import { advanceWinnerAfterMatch } from "../brackets/brackets.service.js";

function asCallbackBody(body: unknown) {
  return body as {
    metadata?: unknown;
    metaData?: unknown;
    gameId?: string | number;
    matchId?: string;
    winningTeam?: unknown;
  };
}

export async function processRiotCallback(params: {
  body: unknown;
  sourceIp?: string | null;
}) {
  const body = asCallbackBody(params.body);
  const metadata = parseRiotCallbackMetadata(body.metadata ?? body.metaData);

  if (!metadata?.nonce) {
    await prisma.riotCallbackEvent.create({
      data: {
        payload: params.body as object,
        sourceIp: params.sourceIp,
        status: RiotCallbackStatus.REJECTED,
        errorMessage: "Missing callback metadata nonce"
      }
    });
    throw badRequest("Invalid Riot callback metadata");
  }

  if (!verifyRiotCallbackMetadata(metadata)) {
    await prisma.riotCallbackEvent.create({
      data: {
        metadataNonce: metadata.nonce,
        payload: params.body as object,
        sourceIp: params.sourceIp,
        status: RiotCallbackStatus.REJECTED,
        errorMessage: "Invalid callback metadata signature"
      }
    });
    throw forbidden("Invalid Riot callback metadata");
  }

  const code = await prisma.riotTournamentCode.findFirst({
    where: { metadataNonce: metadata.nonce },
    include: { match: true }
  });

  const event = await prisma.riotCallbackEvent.create({
    data: {
      matchId: code?.matchId ?? body.matchId,
      riotTournamentCodeId: code?.id,
      riotGameId: body.gameId ? String(body.gameId) : undefined,
      metadataNonce: metadata.nonce,
      payload: params.body as object,
      sourceIp: params.sourceIp,
      status: RiotCallbackStatus.RECEIVED
    }
  });

  if (code) {
    await prisma.riotTournamentCode.update({
      where: { id: code.id },
      data: {
        status: RiotTournamentCodeStatus.CALLBACK_RECEIVED,
        callbackReceivedAt: new Date()
      }
    });

    await prisma.match.update({
      where: { id: code.matchId },
      data: {
        status: code.match.status === MatchStatus.COMPLETED ? MatchStatus.COMPLETED : MatchStatus.RESULT_PENDING,
        riotGameId: body.gameId ? String(body.gameId) : code.match.riotGameId,
        resultSource: ResultSource.RIOT_CALLBACK,
        callbackReceivedAt: new Date()
      }
    });
  }

  return {
    received: true,
    eventId: event.id,
    matchId: code?.matchId ?? body.matchId ?? null
  };
}

function canOperateTournament(user: AuthUser, organizerId: string) {
  return user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.sub === organizerId;
}

function normalizeWinningSide(value?: string) {
  const side = value?.trim().toUpperCase();
  if (side === "HOME" || side === "A") return "HOME";
  if (side === "AWAY" || side === "B") return "AWAY";
  return null;
}

export async function processSandboxTournamentCallback(params: {
  actor: AuthUser;
  body: {
    matchId: string;
    winningSide?: string;
    winnerRegistrationId?: string;
    homeScore: number;
    awayScore: number;
    riotGameId?: string;
    source?: string;
    notes?: string;
  };
  sourceIp?: string | null;
}) {
  const match = await prisma.match.findUnique({
    where: { id: params.body.matchId },
    include: {
      tournament: { select: { id: true, name: true, organizerId: true, status: true } },
      homeRegistration: true,
      awayRegistration: true,
      riotTournamentCode: true
    }
  });

  if (!match) {
    await prisma.riotCallbackEvent.create({
      data: {
        matchId: params.body.matchId,
        payload: params.body as object,
        sourceIp: params.sourceIp,
        status: RiotCallbackStatus.REJECTED,
        errorMessage: "Sandbox callback rejected: match not found"
      }
    });
    throw badRequest("Match not found for sandbox callback");
  }

  if (!canOperateTournament(params.actor, match.tournament.organizerId)) {
    await prisma.riotCallbackEvent.create({
      data: {
        matchId: match.id,
        riotTournamentCodeId: match.riotTournamentCode?.id,
        payload: params.body as object,
        sourceIp: params.sourceIp,
        status: RiotCallbackStatus.REJECTED,
        errorMessage: "Sandbox callback rejected: actor cannot operate tournament"
      }
    });
    throw forbidden("Only tournament staff can simulate tournament callbacks");
  }

  const normalizedSide = normalizeWinningSide(params.body.winningSide);
  const winnerRegistrationId = params.body.winnerRegistrationId
    ?? (normalizedSide === "HOME" ? match.homeRegistrationId : normalizedSide === "AWAY" ? match.awayRegistrationId : null);

  if (!winnerRegistrationId || ![match.homeRegistrationId, match.awayRegistrationId].includes(winnerRegistrationId)) {
    await prisma.riotCallbackEvent.create({
      data: {
        matchId: match.id,
        riotTournamentCodeId: match.riotTournamentCode?.id,
        payload: params.body as object,
        sourceIp: params.sourceIp,
        status: RiotCallbackStatus.REJECTED,
        errorMessage: "Sandbox callback rejected: winner does not belong to match"
      }
    });
    throw badRequest("Winner registration must belong to this match");
  }

  const now = new Date();
  const event = await prisma.riotCallbackEvent.create({
    data: {
      matchId: match.id,
      riotTournamentCodeId: match.riotTournamentCode?.id,
      riotGameId: params.body.riotGameId ?? `SANDBOX-${match.id.slice(0, 8).toUpperCase()}`,
      metadataNonce: match.riotTournamentCode?.metadataNonce,
      payload: {
        ...params.body,
        source: params.body.source ?? "SIMULATED_TOURNAMENT_CODE",
        sandbox: true,
        ownership: "not_official_riot_callback"
      },
      sourceIp: params.sourceIp,
      status: RiotCallbackStatus.PROCESSED,
      processedAt: now
    }
  });

  if (match.riotTournamentCode) {
    await prisma.riotTournamentCode.update({
      where: { id: match.riotTournamentCode.id },
      data: {
        status: RiotTournamentCodeStatus.CALLBACK_RECEIVED,
        callbackReceivedAt: now
      }
    });
  }

  const result = await prisma.matchResult.create({
    data: {
      matchId: match.id,
      reportedByUserId: params.actor.sub,
      winnerRegistrationId,
      homeScore: params.body.homeScore,
      awayScore: params.body.awayScore,
      status: MatchResultStatus.CONFIRMED,
      confirmedByUserId: params.actor.sub,
      confirmedAt: now,
      notes: params.body.notes ?? "Resultado confirmado por callback sandbox de Darkside. No es un callback oficial de Riot."
    }
  });

  const updatedMatch = await prisma.match.update({
    where: { id: match.id },
    data: {
      winnerRegistrationId,
      status: MatchStatus.COMPLETED,
      riotGameId: params.body.riotGameId ?? `SANDBOX-${match.id.slice(0, 8).toUpperCase()}`,
      resultSource: ResultSource.MOCK_RIOT,
      callbackReceivedAt: now,
      resultSyncedAt: now
    }
  });

  await advanceWinnerAfterMatch(match.id);

  return {
    ok: true,
    mode: "sandbox",
    eventId: event.id,
    match: updatedMatch,
    result,
    message: "Sandbox callback processed. Match result was simulated and bracket advancement was triggered."
  };
}
