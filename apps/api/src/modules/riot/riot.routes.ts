import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import type { AuthenticatedRequest } from "../../types.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { badRequest } from "../../utils/http-error.js";
import { getRequestIp } from "../../utils/request-ip.js";
import { getRequestParam } from "../../utils/request-param.js";
import { createAuditLog } from "../audit/audit.service.js";
import { processRiotCallback } from "./riot-callback.service.js";
import { finishMockMatchSchema, generateTournamentCodeSchema, linkRiotAccountSchema } from "./riot.schemas.js";
import { getMyRiotAccounts, getRiotMode, linkRiotAccount } from "./riot.service.js";
import { finishMockRiotMatch, generateMockableTournamentCode } from "./riot-tournament.service.js";

export const riotRouter = Router();

function requireParam(value: string | string[] | undefined, name: string) {
  const param = getRequestParam(value);
  if (!param) {
    throw badRequest(`${name} is required`);
  }

  return param;
}

riotRouter.get(
  "/status",
  requireAuth,
  asyncHandler(async (_request, response) => {
    response.json({
      mode: getRiotMode(),
      apiKeyConfigured: Boolean(process.env.RIOT_API_KEY),
      platform: process.env.RIOT_PLATFORM ?? "LA1",
      region: process.env.RIOT_REGION ?? "AMERICAS"
    });
  })
);

riotRouter.post(
  "/accounts/link",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const payload = linkRiotAccountSchema.parse(request.body);
    const account = await linkRiotAccount({
      userId: request.user!.sub,
      gameName: payload.gameName,
      tagLine: payload.tagLine,
      game: payload.game,
      platformRoute: payload.platformRoute,
      regionalRoute: payload.regionalRoute
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "riot.account.link",
      entityType: "user_game_account",
      entityId: account.id,
      after: {
        provider: account.provider,
        game: account.game,
        riotGameName: account.riotGameName,
        riotTagLine: account.riotTagLine,
        puuid: account.puuid,
        mode: getRiotMode()
      },
      ipAddress: getRequestIp(request)
    });

    response.status(201).json(account);
  })
);

riotRouter.get(
  "/accounts/me",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const accounts = await getMyRiotAccounts(request.user!.sub);
    response.json(accounts);
  })
);

riotRouter.post(
  "/matches/:matchId/code",
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const matchId = requireParam(request.params.matchId, "Match id");
    const payload = generateTournamentCodeSchema.parse(request.body);
    const match = await generateMockableTournamentCode({
      matchId,
      user: request.user!,
      mapType: payload.mapType,
      pickType: payload.pickType,
      teamSize: payload.teamSize,
      spectatorType: payload.spectatorType
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "riot.tournament_code.generate",
      entityType: "match",
      entityId: match.id,
      after: {
        riotShortCode: match.riotShortCode,
        riotPlatform: match.riotPlatform,
        riotRegion: match.riotRegion,
        mode: getRiotMode()
      },
      ipAddress: getRequestIp(request)
    });

    response.status(201).json(match);
  })
);

riotRouter.post(
  "/mock/matches/:matchId/finish",
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const matchId = requireParam(request.params.matchId, "Match id");
    const payload = finishMockMatchSchema.parse(request.body);
    const result = await finishMockRiotMatch({
      matchId,
      user: request.user!,
      winnerRegistrationId: payload.winnerRegistrationId,
      homeScore: payload.homeScore,
      awayScore: payload.awayScore,
      riotGameId: payload.riotGameId
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "riot.mock_match.finish",
      entityType: "match",
      entityId: result.match.id,
      after: {
        winnerRegistrationId: result.match.winnerRegistrationId,
        riotGameId: result.match.riotGameId,
        resultSource: result.match.resultSource
      },
      ipAddress: getRequestIp(request)
    });

    response.json(result);
  })
);

riotRouter.post(
  "/tournament/callback",
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const result = await processRiotCallback({
      user: request.user,
      body: request.body
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "riot.callback.mock",
      entityType: "match",
      entityId: result.match.id,
      after: {
        resultSource: result.match.resultSource,
        riotGameId: result.match.riotGameId
      },
      ipAddress: getRequestIp(request)
    });

    response.json(result);
  })
);

riotRouter.post(
  "/matches/:matchId/resync",
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const matchId = requireParam(request.params.matchId, "Match id");

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "riot.match.resync.request",
      entityType: "match",
      entityId: matchId,
      after: { mode: getRiotMode() },
      ipAddress: getRequestIp(request)
    });

    response.json({
      matchId,
      mode: getRiotMode(),
      status: "queued",
      message: "Resync placeholder ready for Riot production integration"
    });
  })
);
