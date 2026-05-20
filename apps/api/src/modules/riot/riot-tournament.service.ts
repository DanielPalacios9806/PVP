import { MatchResultStatus, MatchStatus, ResultSource } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { badRequest, forbidden, notFound } from "../../utils/http-error.js";
import type { AuthUser } from "../../types.js";
import { advanceWinnerAfterMatch } from "../brackets/brackets.service.js";
import { getRiotAdapter, getRiotMode } from "./riot.service.js";

function canOperateMatch(user: AuthUser, organizerId: string) {
  return user.role === "ADMIN" || user.role === "ORGANIZER" || user.sub === organizerId;
}

export async function generateMockableTournamentCode(params: {
  matchId: string;
  user: AuthUser;
  mapType: string;
  pickType: string;
  teamSize: number;
  spectatorType: string;
}) {
  const match = await prisma.match.findUnique({
    where: { id: params.matchId },
    include: { tournament: true }
  });

  if (!match) {
    throw notFound("Match not found");
  }

  if (!canOperateMatch(params.user, match.tournament.organizerId)) {
    throw forbidden("Only tournament staff can generate Riot tournament codes");
  }

  const codeReadyStatuses: MatchStatus[] = [
    MatchStatus.PENDING,
    MatchStatus.READY,
    MatchStatus.IN_PROGRESS
  ];

  if (!codeReadyStatuses.includes(match.status)) {
    throw badRequest("Tournament code can only be generated for pending or ready matches");
  }

  const code = await getRiotAdapter().generateTournamentCode({
    matchId: match.id,
    mapType: params.mapType,
    pickType: params.pickType,
    teamSize: params.teamSize,
    spectatorType: params.spectatorType
  });

  return prisma.match.update({
    where: { id: match.id },
    data: {
      riotShortCode: code.shortCode,
      riotPlatform: match.tournament.platformRoute,
      riotRegion: match.tournament.regionalRoute,
      status: MatchStatus.READY
    }
  });
}

export async function finishMockRiotMatch(params: {
  matchId: string;
  user: AuthUser;
  winnerRegistrationId: string;
  homeScore: number;
  awayScore: number;
  riotGameId?: string;
}) {
  if (getRiotMode() !== "mock") {
    throw badRequest("Mock match finish is only available when RIOT_MODE=mock");
  }

  const match = await prisma.match.findUnique({
    where: { id: params.matchId },
    include: { tournament: true }
  });

  if (!match) {
    throw notFound("Match not found");
  }

  if (!canOperateMatch(params.user, match.tournament.organizerId)) {
    throw forbidden("Only tournament staff can simulate Riot results");
  }

  if (![match.homeRegistrationId, match.awayRegistrationId].includes(params.winnerRegistrationId)) {
    throw badRequest("Winner registration must belong to this match");
  }

  const result = await prisma.matchResult.create({
    data: {
      matchId: match.id,
      reportedByUserId: params.user.sub,
      winnerRegistrationId: params.winnerRegistrationId,
      homeScore: params.homeScore,
      awayScore: params.awayScore,
      status: MatchResultStatus.CONFIRMED,
      confirmedByUserId: params.user.sub,
      confirmedAt: new Date(),
      notes: "Resultado simulado por Riot mock."
    }
  });

  const updatedMatch = await prisma.match.update({
    where: { id: match.id },
    data: {
      winnerRegistrationId: params.winnerRegistrationId,
      status: MatchStatus.COMPLETED,
      riotGameId: params.riotGameId ?? `MOCK-GAME-${match.id.slice(0, 8).toUpperCase()}`,
      resultSource: ResultSource.MOCK_RIOT,
      callbackReceivedAt: new Date(),
      resultSyncedAt: new Date()
    }
  });

  await advanceWinnerAfterMatch(match.id);

  return { match: updatedMatch, result };
}
