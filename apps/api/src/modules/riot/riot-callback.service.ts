import { MatchStatus, ResultSource, RiotCallbackStatus, RiotTournamentCodeStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { badRequest, forbidden } from "../../utils/http-error.js";
import { parseRiotCallbackMetadata, verifyRiotCallbackMetadata } from "./riot-callback-signature.js";

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
