import { createHash, randomUUID } from "node:crypto";
import type { RiotAdapter, RiotTournamentCodeInput } from "./riot.adapter.js";

function stableId(prefix: string, value: string) {
  const digest = createHash("sha256").update(value.toLowerCase()).digest("hex").slice(0, 28);
  return `${prefix}_${digest}`;
}

export class RiotMockAdapter implements RiotAdapter {
  async lookupAccountByRiotId(params: {
    gameName: string;
    tagLine: string;
    platformRoute: string;
    regionalRoute: string;
  }) {
    const identity = `${params.gameName}#${params.tagLine}:${params.platformRoute}:${params.regionalRoute}`;

    return {
      puuid: stableId("mock-puuid", identity),
      summonerId: stableId("mock-summoner", identity),
      gameName: params.gameName,
      tagLine: params.tagLine,
      platformRoute: params.platformRoute,
      regionalRoute: params.regionalRoute
    };
  }

  async generateTournamentCode(input: RiotTournamentCodeInput) {
    const nonce = randomUUID();

    return {
      shortCode: `MOCK-${input.matchId.slice(0, 8).toUpperCase()}-${nonce.slice(0, 6).toUpperCase()}`,
      metadataNonce: nonce
    };
  }
}
