import { ExternalAccountProvider, RiotLinkedAccountStatus } from "@prisma/client";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { badRequest } from "../../utils/http-error.js";
import type { RiotAdapter } from "./riot.adapter.js";
import { getRiotRuntimeConfig, riotRequest } from "./riot.client.js";
import { RiotMockAdapter } from "./riot.mock-adapter.js";
import { RiotRealAdapter } from "./riot.real-adapter.js";

export function getRiotMode() {
  return env.RIOT_API_MODE;
}

export function getRiotAdapter(): RiotAdapter {
  if (env.RIOT_API_MODE === "mock") {
    return new RiotMockAdapter();
  }

  return new RiotRealAdapter();
}

function buildLookupMetadata(extra?: Record<string, unknown>) {
  return {
    mode: env.RIOT_API_MODE,
    source: env.RIOT_API_MODE === "mock" ? "mock-adapter" : "riot-api",
    verificationMethod: "LOOKUP_ONLY",
    ownershipVerified: false,
    officialRsoRequired: true,
    warning:
      "This confirms the Riot ID exists, but it does not prove that the current Darkside user owns the Riot account.",
    ...extra
  };
}

export async function checkRiotAccount(params: {
  gameName: string;
  tagLine: string;
  platformRoute: string;
  regionalRoute: string;
  userId?: string;
}) {
  const account = await getRiotAdapter().lookupAccountByRiotId({
    gameName: params.gameName,
    tagLine: params.tagLine,
    platformRoute: params.platformRoute,
    regionalRoute: params.regionalRoute
  });

  if (!account?.puuid) {
    throw badRequest("Riot account could not be resolved in the current mode");
  }

  return {
    ok: true,
    mode: env.RIOT_API_MODE,
    ownershipVerified: false,
    verificationMethod: "LOOKUP_ONLY",
    message:
      "Riot ID exists. Official ownership verification requires Riot Sign On approval and a Riot login flow.",
    account: {
      gameName: account.gameName,
      tagLine: account.tagLine,
      platformRoute: account.platformRoute,
      regionalRoute: account.regionalRoute,
      puuidPresent: Boolean(account.puuid),
      summonerIdPresent: Boolean(account.summonerId)
    }
  };
}

export async function linkRiotAccount(params: {
  userId: string;
  gameName: string;
  tagLine: string;
  game: string;
  platformRoute: string;
  regionalRoute: string;
}) {
  const account = await getRiotAdapter().lookupAccountByRiotId({
    gameName: params.gameName,
    tagLine: params.tagLine,
    platformRoute: params.platformRoute,
    regionalRoute: params.regionalRoute
  });

  if (!account?.puuid) {
    throw badRequest("Riot account could not be resolved in the current mode");
  }

  const existing = await prisma.userGameAccount.findFirst({
    where: {
      userId: params.userId,
      provider: ExternalAccountProvider.RIOT,
      game: params.game
    }
  });

  const data = {
    provider: ExternalAccountProvider.RIOT,
    game: params.game,
    riotGameName: account.gameName,
    riotTagLine: account.tagLine,
    externalPlayerId: account.puuid,
    puuid: account.puuid,
    summonerId: account.summonerId,
    platformRoute: account.platformRoute,
    regionalRoute: account.regionalRoute,
    verified: false,
    verificationStatus: env.RIOT_API_MODE === "mock" ? RiotLinkedAccountStatus.MANUAL : RiotLinkedAccountStatus.RSO_PENDING,
    verifiedAt: null,
    lastSyncedAt: new Date(),
    metadata: buildLookupMetadata({ savedAt: new Date().toISOString() })
  };

  if (existing) {
    return prisma.userGameAccount.update({
      where: { id: existing.id },
      data
    });
  }

  return prisma.userGameAccount.create({
    data: {
      userId: params.userId,
      ...data
    }
  });
}

export function getRiotRsoStatus() {
  const config = getRiotRuntimeConfig();

  return {
    enabled: false,
    ready: config.readyForOfficialRso,
    mode: config.mode,
    status: config.readyForOfficialRso ? "CONFIGURED_PENDING_RIOT_APPROVAL" : "PENDING_RIOT_APPROVAL",
    message:
      "Official Riot account ownership verification requires Riot Sign On approval. Lookup-only validation is available for internal testing.",
    requiredEnvironment: ["RIOT_RSO_CLIENT_ID", "RIOT_RSO_CLIENT_SECRET", "RIOT_RSO_REDIRECT_URI"],
    recommendedFlow: "redirect",
    config: {
      rsoClientIdConfigured: config.rsoClientIdConfigured,
      rsoRedirectUriConfigured: config.rsoRedirectUriConfigured,
      readyForOfficialRso: config.readyForOfficialRso
    }
  };
}

export function startRiotRso() {
  const status = getRiotRsoStatus();

  return {
    ...status,
    redirectUrl: null,
    message:
      "Riot Sign On is not active yet. Darkside can validate that a Riot ID exists, but official ownership linking must wait for Riot approval."
  };
}

export async function unlinkRiotAccount(params: { userId: string; accountId: string }) {
  const existing = await prisma.userGameAccount.findFirst({
    where: {
      id: params.accountId,
      userId: params.userId,
      provider: ExternalAccountProvider.RIOT
    }
  });

  if (!existing) {
    throw badRequest("Riot account link not found");
  }

  await prisma.userGameAccount.delete({
    where: { id: existing.id }
  });

  return { id: existing.id, unlinked: true };
}

export async function testRiotConnection(params?: { gameName?: string; tagLine?: string; userId?: string }) {
  const config = getRiotRuntimeConfig();

  if (config.mode === "mock") {
    return {
      ok: true,
      skippedExternalRequest: true,
      message: "RIOT_API_MODE=mock. No external Riot request was made.",
      config
    };
  }

  if (!params?.gameName || !params?.tagLine) {
    return {
      ok: false,
      skippedExternalRequest: true,
      message: "Provide a Riot ID and tagline to run a safe backend-only test request.",
      config
    };
  }

  const account = await riotRequest<{ puuid: string; gameName: string; tagLine: string }>({
    route: "regional",
    path: `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(params.gameName)}/${encodeURIComponent(params.tagLine)}`,
    userId: params.userId,
    metadata: { operation: "adminTestConnection" }
  });

  return {
    ok: true,
    skippedExternalRequest: false,
    account: {
      gameName: account.gameName,
      tagLine: account.tagLine,
      puuidPresent: Boolean(account.puuid)
    },
    config
  };
}

export async function getRiotAdminOverview() {
  const [totalRequests, successfulRequests, recentLogs, recentErrors, codeCount, callbackCount, pendingCallbacks] =
    await Promise.all([
      prisma.riotApiLog.count(),
      prisma.riotApiLog.count({ where: { success: true } }),
      prisma.riotApiLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 20
      }),
      prisma.riotApiLog.findMany({
        where: { success: false },
        orderBy: { createdAt: "desc" },
        take: 20
      }),
      prisma.riotTournamentCode.count(),
      prisma.riotCallbackEvent.count(),
      prisma.riotCallbackEvent.count({ where: { status: "RECEIVED" } })
    ]);

  const errorsByType = await prisma.riotApiLog.groupBy({
    by: ["errorType"],
    where: {
      success: false,
      errorType: {
        not: null
      }
    },
    _count: {
      _all: true
    },
    orderBy: {
      _count: {
        errorType: "desc"
      }
    },
    take: 10
  });

  return {
    config: getRiotRuntimeConfig(),
    metrics: {
      totalRequests,
      successfulRequests,
      successRate: totalRequests ? Math.round((successfulRequests / totalRequests) * 100) : 0,
      codeCount,
      callbackCount,
      pendingCallbacks
    },
    errorsByType: errorsByType.map((item) => ({
      errorType: item.errorType,
      count: item._count._all
    })),
    recentLogs,
    recentErrors
  };
}

export async function getMyRiotAccounts(userId: string) {
  return prisma.userGameAccount.findMany({
    where: {
      userId,
      provider: ExternalAccountProvider.RIOT
    },
    orderBy: { updatedAt: "desc" }
  });
}
