import { env } from "../../config/env.js";
import { badRequest } from "../../utils/http-error.js";
import type { RiotAdapter, RiotTournamentCode, RiotTournamentCodeInput } from "./riot.adapter.js";
import { buildRiotCallbackMetadata } from "./riot-callback-signature.js";
import { riotRequest } from "./riot.client.js";

type RiotAccountResponse = {
  puuid: string;
  gameName: string;
  tagLine: string;
};

type RiotSummonerResponse = {
  id?: string;
  puuid?: string;
};

export class RiotRealAdapter implements RiotAdapter {
  async lookupAccountByRiotId(params: {
    gameName: string;
    tagLine: string;
    platformRoute: string;
    regionalRoute: string;
  }) {
    if (!env.RIOT_API_KEY) {
      throw badRequest("RIOT_API_KEY is required outside mock mode");
    }

    const account = await riotRequest<RiotAccountResponse>({
      route: "regional",
      path: `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(params.gameName)}/${encodeURIComponent(params.tagLine)}`,
      metadata: { operation: "lookupAccountByRiotId" }
    });

    let summonerId: string | undefined;
    try {
      const summoner = await riotRequest<RiotSummonerResponse>({
        route: "platform",
        path: `/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(account.puuid)}`,
        metadata: { operation: "lookupSummonerByPuuid" },
        retries: 0
      });
      summonerId = summoner.id;
    } catch {
      summonerId = undefined;
    }

    return {
      puuid: account.puuid,
      gameName: account.gameName,
      tagLine: account.tagLine,
      summonerId,
      platformRoute: params.platformRoute,
      regionalRoute: params.regionalRoute
    };
  }

  async generateTournamentCode(input: RiotTournamentCodeInput): Promise<RiotTournamentCode> {
    if (!env.RIOT_API_KEY) {
      throw badRequest("RIOT_API_KEY is required outside mock mode");
    }

    if (!env.RIOT_TOURNAMENT_API_ENABLED) {
      throw badRequest("Riot Tournament API is disabled by configuration");
    }

    const riotTournamentId = env.RIOT_TOURNAMENT_ID;
    if (!riotTournamentId) {
      throw badRequest("RIOT_TOURNAMENT_ID is required to generate Riot tournament codes");
    }

    const metadataNonce = `ds-${input.matchId}-${Date.now()}`;
    const codes = await riotRequest<string[]>({
      route: "platform",
      method: "POST",
      path: `/lol/tournament/v5/codes?count=1&tournamentId=${encodeURIComponent(riotTournamentId)}`,
      matchId: input.matchId,
      body: {
        mapType: input.mapType,
        pickType: input.pickType,
        teamSize: input.teamSize,
        spectatorType: input.spectatorType,
        metadata: buildRiotCallbackMetadata(metadataNonce)
      },
      metadata: { operation: "generateTournamentCode" }
    });

    const shortCode = codes[0];
    if (!shortCode) {
      throw badRequest("Riot did not return a tournament code");
    }

    return {
      shortCode,
      metadataNonce
    };
  }
}
