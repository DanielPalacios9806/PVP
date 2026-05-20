import { ExternalAccountProvider } from "@prisma/client";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { badRequest } from "../../utils/http-error.js";
import type { RiotAdapter } from "./riot.adapter.js";
import { RiotMockAdapter } from "./riot.mock-adapter.js";
import { RiotRealAdapter } from "./riot.real-adapter.js";

export function getRiotMode() {
  return env.RIOT_MODE;
}

export function getRiotAdapter(): RiotAdapter {
  if (env.RIOT_MODE === "mock") {
    return new RiotMockAdapter();
  }

  return new RiotRealAdapter();
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
    verified: env.RIOT_MODE === "mock" || env.RIOT_MODE === "development",
    verifiedAt: new Date(),
    lastSyncedAt: new Date(),
    metadata: {
      mode: env.RIOT_MODE,
      source: env.RIOT_MODE === "mock" ? "mock-adapter" : "riot-api"
    }
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

export async function getMyRiotAccounts(userId: string) {
  return prisma.userGameAccount.findMany({
    where: {
      userId,
      provider: ExternalAccountProvider.RIOT
    },
    orderBy: { updatedAt: "desc" }
  });
}
