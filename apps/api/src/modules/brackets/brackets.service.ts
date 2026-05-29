import { BracketStatus, MatchStatus, RoundStatus, TournamentStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { badRequest } from "../../utils/http-error.js";

const liveMatchStatuses = new Set<MatchStatus>([
  MatchStatus.READY,
  MatchStatus.IN_PROGRESS,
  MatchStatus.RESULT_PENDING,
  MatchStatus.DISPUTED
]);

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

  const createdMatches = await prisma.$transaction(matches);

  for (const createdMatch of createdMatches) {
    if (createdMatch.status === MatchStatus.COMPLETED && createdMatch.winnerRegistrationId) {
      await advanceWinnerAfterMatch(createdMatch.id);
    }
  }

  await refreshBracketProgress(bracket.id);

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

async function refreshBracketProgress(bracketId: string) {
  const bracket = await prisma.bracket.findUnique({
    where: { id: bracketId },
    include: {
      tournament: true,
      rounds: {
        orderBy: { sequence: "asc" },
        include: { matches: { orderBy: { createdAt: "asc" } } }
      }
    }
  });

  if (!bracket) {
    return null;
  }

  const allMatches = bracket.rounds.flatMap((round) => round.matches);
  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  const finalMatch = finalRound?.matches[0];

  for (const round of bracket.rounds) {
    const roundMatches = round.matches;
    const allRoundMatchesCompleted =
      roundMatches.length > 0 &&
      roundMatches.every((match) => match.status === MatchStatus.COMPLETED || match.status === MatchStatus.CANCELLED);
    const hasLiveRoundMatch = roundMatches.some((match) => liveMatchStatuses.has(match.status));

    const nextStatus = allRoundMatchesCompleted
      ? RoundStatus.COMPLETED
      : hasLiveRoundMatch || round.sequence === 1
        ? RoundStatus.ACTIVE
        : RoundStatus.PENDING;

    if (round.status !== nextStatus) {
      await prisma.round.update({
        where: { id: round.id },
        data: { status: nextStatus }
      });
    }
  }

  const finalCompleted = finalMatch?.status === MatchStatus.COMPLETED && Boolean(finalMatch.winnerRegistrationId);
  const nextBracketStatus = finalCompleted ? BracketStatus.COMPLETED : BracketStatus.GENERATED;

  if (bracket.status !== nextBracketStatus) {
    await prisma.bracket.update({
      where: { id: bracket.id },
      data: { status: nextBracketStatus }
    });
  }

  if (finalCompleted && bracket.tournament.status !== TournamentStatus.COMPLETED) {
    await prisma.tournament.update({
      where: { id: bracket.tournamentId },
      data: { status: TournamentStatus.COMPLETED }
    });
  } else if (
    !finalCompleted &&
    bracket.tournament.status === TournamentStatus.COMPLETED &&
    allMatches.some((match) => match.status !== MatchStatus.COMPLETED)
  ) {
    await prisma.tournament.update({
      where: { id: bracket.tournamentId },
      data: { status: TournamentStatus.IN_PROGRESS }
    });
  }

  return { bracketId: bracket.id, finalCompleted };
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

  if (!currentRound) {
    return null;
  }

  if (!nextRound) {
    await refreshBracketProgress(match.round.bracket.id);
    return null;
  }

  const currentMatchIndex = currentRound.matches.findIndex((roundMatch) => roundMatch.id === match.id);
  const nextMatch = nextRound.matches[Math.floor(currentMatchIndex / 2)];

  if (currentMatchIndex < 0 || !nextMatch) {
    await refreshBracketProgress(match.round.bracket.id);
    return null;
  }

  const placeAsHome = currentMatchIndex % 2 === 0;
  const currentSlotValue = placeAsHome ? nextMatch.homeRegistrationId : nextMatch.awayRegistrationId;

  if (currentSlotValue && currentSlotValue !== match.winnerRegistrationId) {
    await refreshBracketProgress(match.round.bracket.id);
    return nextMatch;
  }

  const nextHome = placeAsHome ? match.winnerRegistrationId : nextMatch.homeRegistrationId;
  const nextAway = placeAsHome ? nextMatch.awayRegistrationId : match.winnerRegistrationId;

  const updatedNextMatch = await prisma.match.update({
    where: { id: nextMatch.id },
    data: {
      homeRegistrationId: nextHome,
      awayRegistrationId: nextAway,
      status: nextHome && nextAway ? MatchStatus.READY : MatchStatus.PENDING
    }
  });

  await refreshBracketProgress(match.round.bracket.id);

  return updatedNextMatch;
}
