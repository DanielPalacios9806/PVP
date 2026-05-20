import { env } from "../../config/env.js";
import { badRequest } from "../../utils/http-error.js";
import type { RiotAdapter, RiotTournamentCode, RiotTournamentCodeInput } from "./riot.adapter.js";

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

    // Real Riot calls stay server-side only. The endpoint shape is ready for
    // development/production keys, but the MVP keeps mock mode as the default.
    return {
      puuid: "",
      gameName: params.gameName,
      tagLine: params.tagLine,
      platformRoute: params.platformRoute,
      regionalRoute: params.regionalRoute
    };
  }

  async generateTournamentCode(_input: RiotTournamentCodeInput): Promise<RiotTournamentCode> {
    if (!env.RIOT_API_KEY) {
      throw badRequest("RIOT_API_KEY is required outside mock mode");
    }

    throw badRequest("Riot Tournament API is not enabled yet");
  }
}
