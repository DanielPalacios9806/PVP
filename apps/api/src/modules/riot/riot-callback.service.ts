import { badRequest } from "../../utils/http-error.js";
import { finishMockRiotMatch } from "./riot-tournament.service.js";
import type { AuthUser } from "../../types.js";

export async function processRiotCallback(params: {
  user?: AuthUser;
  body: unknown;
}) {
  if (!params.user) {
    throw badRequest("Signed Riot callbacks are not enabled in MVP mock mode");
  }

  return finishMockRiotMatch({
    matchId: (params.body as { matchId?: string }).matchId ?? "",
    user: params.user,
    winnerRegistrationId: (params.body as { winnerRegistrationId?: string }).winnerRegistrationId ?? "",
    homeScore: Number((params.body as { homeScore?: number }).homeScore ?? 0),
    awayScore: Number((params.body as { awayScore?: number }).awayScore ?? 0),
    riotGameId: (params.body as { riotGameId?: string }).riotGameId
  });
}
