import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { createRateLimiter } from "../../middlewares/rate-limit.js";
import type { AuthenticatedRequest } from "../../types.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { badRequest } from "../../utils/http-error.js";
import { getRequestIp } from "../../utils/request-ip.js";
import { getRequestParam } from "../../utils/request-param.js";
import { createAuditLog } from "../audit/audit.service.js";
import { processRiotCallback } from "./riot-callback.service.js";
import { getRiotRuntimeConfig } from "./riot.client.js";
import { finishMockMatchSchema, generateTournamentCodeSchema, linkRiotAccountSchema, riotAccountLookupSchema, riotCapabilitiesCheckSchema } from "./riot.schemas.js";
import { checkRiotAccount, checkRiotCapabilities, getMyRiotAccounts, getRiotMode, getRiotRsoStatus, linkRiotAccount, startRiotRso, unlinkRiotAccount } from "./riot.service.js";
import { finishMockRiotMatch, generateMockableTournamentCode } from "./riot-tournament.service.js";

export const riotRouter = Router();
const riotRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many Riot integration requests. Please try again later."
});

function requireParam(value: string | string[] | undefined, name: string) {
  const param = getRequestParam(value);
  if (!param) {
    throw badRequest(`${name} is required`);
  }

  return param;
}


riotRouter.get(
  "/health",
  requireAuth,
  asyncHandler(async (_request, response) => {
    const config = getRiotRuntimeConfig();
    response.json({
      ok: true,
      ...config,
      message: config.readyForAccountLookup
        ? "Riot integration is ready for safe backend account checks."
        : "Riot lookup is not ready. Configure RIOT_API_KEY or use mock mode."
    });
  })
);

riotRouter.post(
  "/accounts/check",
  riotRateLimiter,
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const payload = riotAccountLookupSchema.parse(request.body);
    const result = await checkRiotAccount({
      gameName: payload.gameName,
      tagLine: payload.tagLine,
      platformRoute: payload.platformRoute,
      regionalRoute: payload.regionalRoute,
      userId: request.user!.sub
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "riot.account.lookup",
      entityType: "riot_account",
      entityId: `${payload.gameName}#${payload.tagLine}`,
      after: {
        gameName: payload.gameName,
        tagLine: payload.tagLine,
        platformRoute: payload.platformRoute,
        regionalRoute: payload.regionalRoute,
        ownershipVerified: false,
        verificationMethod: "LOOKUP_ONLY",
        mode: getRiotMode()
      },
      ipAddress: getRequestIp(request)
    });

    response.json(result);
  })
);


riotRouter.post(
  "/capabilities/check",
  riotRateLimiter,
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const payload = riotCapabilitiesCheckSchema.parse(request.body);
    const result = await checkRiotCapabilities({
      gameName: payload.gameName,
      tagLine: payload.tagLine,
      platformRoute: payload.platformRoute,
      regionalRoute: payload.regionalRoute,
      userId: request.user!.sub
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "riot.capabilities.check",
      entityType: "riot_api",
      entityId: `${payload.gameName}#${payload.tagLine}`,
      after: {
        mode: getRiotMode(),
        accountV1: (result as Record<string, unknown>).accountV1,
        summonerV4: (result as Record<string, unknown>).summonerV4,
        leagueV4: (result as Record<string, unknown>).leagueV4,
        matchV5: (result as Record<string, unknown>).matchV5,
        matchDetailV5: (result as Record<string, unknown>).matchDetailV5
      },
      ipAddress: getRequestIp(request)
    });

    response.json(result);
  })
);

riotRouter.get(
  "/status",
  requireAuth,
  asyncHandler(async (_request, response) => {
    response.json(getRiotRuntimeConfig());
  })
);


riotRouter.get(
  "/rso/status",
  requireAuth,
  asyncHandler(async (_request, response) => {
    response.json(getRiotRsoStatus());
  })
);

riotRouter.get(
  "/rso/start",
  requireAuth,
  asyncHandler(async (_request, response) => {
    response.status(202).json(startRiotRso());
  })
);

riotRouter.post(
  "/accounts/link",
  riotRateLimiter,
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
      action: "riot.account.lookup_save",
      entityType: "user_game_account",
      entityId: account.id,
      after: {
        provider: account.provider,
        game: account.game,
        riotGameName: account.riotGameName,
        riotTagLine: account.riotTagLine,
        puuid: account.puuid,
        mode: getRiotMode(),
        ownershipVerified: false,
        verificationMethod: "LOOKUP_ONLY"
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

riotRouter.delete(
  "/accounts/:id",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const accountId = requireParam(request.params.id, "Riot account id");
    const result = await unlinkRiotAccount({
      userId: request.user!.sub,
      accountId
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "riot.account.unlink",
      entityType: "user_game_account",
      entityId: accountId,
      after: result,
      ipAddress: getRequestIp(request)
    });

    response.json(result);
  })
);

riotRouter.post(
  "/matches/:matchId/code",
  riotRateLimiter,
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN", "SUPER_ADMIN"]),
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
  requireRole(["ORGANIZER", "ADMIN", "SUPER_ADMIN"]),
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
  riotRateLimiter,
  asyncHandler(async (request, response) => {
    const result = await processRiotCallback({
      body: request.body,
      sourceIp: getRequestIp(request)
    });

    response.json(result);
  })
);

riotRouter.post(
  "/matches/:matchId/resync",
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN", "SUPER_ADMIN"]),
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
