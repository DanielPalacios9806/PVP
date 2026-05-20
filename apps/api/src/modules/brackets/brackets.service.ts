import { MatchStatus, RoundStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { badRequest } from "../../utils/http-error.js";

function nextPowerOfTwo(value: number) {
  let p = 1;
  while (p < value) p *= 2;
  return p;
}

export async function generateSingleEliminationBracket(input: {
  tournamentId: string;
  bestOf?: number;
}) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: input.tournamentId },
    include: {
      registrations: {
        where: { status: "CONFIRMED" },
        orderBy: { createdAt: "asc" }
      },
      bracket: true
    }
  });

  if (!tournament) {
    throw badRequest("Tournament not found");
  }

  if (tournament.bracket) {
    throw badRequest("Bracket already exists");
  }

  const participants = tournament.registrations;
  const minParticipants = tournament.minParticipants ?? 2;
  if (participants.length < minParticipants) {
    throw badRequest("Not enough participants to generate bracket");
  }

  const size = nextPowerOfTwo(participants.length);
  const roundsCount = Math.log2(size);

  const bracket = await prisma.bracket.create({
    data: {
      tournamentId: tournament.id,
      status: "GENERATED"
    }
  });

  const rounds = [];
  for (let i = 1; i <= roundsCount; i += 1) {
    rounds.push(
      prisma.round.create({
        data: {
          bracketId: bracket.id,
          name: i === roundsCount ? "Final" : `Round ${i}`,
          sequence: i,
          status: i === 1 ? RoundStatus.ACTIVE : RoundStatus.PENDING
        }
      })
    );
  }

  const createdRounds = await prisma.$transaction(rounds);
  const firstRound = createdRounds.find((r) => r.sequence === 1)!;
  const matchesInFirstRound = size / 2;

  const padded: Array<string | null> = participants.map((p) => p.id);
  while (padded.length < size) padded.push(null);

  const matches = [];
  for (let i = 0; i < matchesInFirstRound; i += 1) {
    const homeRegistrationId = padded[i * 2];
    const awayRegistrationId = padded[i * 2 + 1];
    const winnerRegistrationId = homeRegistrationId && !awayRegistrationId ? homeRegistrationId : null;

    matches.push(
      prisma.match.create({
        data: {
          tournamentId: tournament.id,
          roundId: firstRound.id,
          homeRegistrationId,
          awayRegistrationId,
          winnerRegistrationId,
          bestOf: input.bestOf ?? 1,
          status: homeRegistrationId && awayRegistrationId ? MatchStatus.READY : MatchStatus.COMPLETED
        }
      })
    );
  }

  for (let roundSequence = 2; roundSequence <= roundsCount; roundSequence += 1) {
    const round = createdRounds.find((createdRound) => createdRound.sequence === roundSequence)!;
    const matchesInRound = size / 2 ** roundSequence;

    for (let i = 0; i < matchesInRound; i += 1) {
      matches.push(
        prisma.match.create({
          data: {
            tournamentId: tournament.id,
            roundId: round.id,
            bestOf: input.bestOf ?? 1,
            status: MatchStatus.PENDING
          }
        })
      );
    }
  }

  await prisma.$transaction(matches);

  return prisma.bracket.findUnique({
    where: { id: bracket.id },
    include: {
      rounds: {
        orderBy: { sequence: "asc" },
        include: { matches: { orderBy: { createdAt: "asc" } } }
      }
    }
  });
}

export async function advanceWinnerAfterMatch(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      round: {
        include: {
          bracket: {
            include: {
              rounds: {
                orderBy: { sequence: "asc" },
                include: {
                  matches: {
                    orderBy: { createdAt: "asc" }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!match?.round || !match.winnerRegistrationId) {
    return null;
  }

  const rounds = match.round.bracket.rounds;
  const currentRound = rounds.find((round) => round.id === match.roundId);
  const nextRound = rounds.find((round) => round.sequence === match.round!.sequence + 1);

  if (!currentRound || !nextRound) {
    return null;
  }

  const currentMatchIndex = currentRound.matches.findIndex((roundMatch) => roundMatch.id === match.id);
  const nextMatch = nextRound.matches[Math.floor(currentMatchIndex / 2)];

  if (currentMatchIndex < 0 || !nextMatch) {
    return null;
  }

  const placement =
    currentMatchIndex % 2 === 0
      ? { homeRegistrationId: match.winnerRegistrationId }
      : { awayRegistrationId: match.winnerRegistrationId };
  const nextHome = placement.homeRegistrationId ?? nextMatch.homeRegistrationId;
  const nextAway = placement.awayRegistrationId ?? nextMatch.awayRegistrationId;

  return prisma.match.update({
    where: { id: nextMatch.id },
    data: {
      ...placement,
      status: nextHome && nextAway ? MatchStatus.READY : MatchStatus.PENDING
    }
  });
}
