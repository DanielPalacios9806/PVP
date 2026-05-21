import { TeamMemberRole, type MatchResultStatus, type UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

const captainRoles = [TeamMemberRole.OWNER, TeamMemberRole.CAPTAIN];

export async function loadMatchForAuthorization(matchId: string) {
  return prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: {
        select: {
          id: true,
          organizerId: true,
          status: true,
          type: true
        }
      },
      homeRegistration: {
        include: {
          team: {
            select: {
              id: true,
              ownerId: true,
              members: {
                where: {
                  role: {
                    in: captainRoles
                  }
                },
                select: {
                  userId: true,
                  role: true
                }
              }
            }
          },
          user: {
            select: {
              id: true
            }
          }
        }
      },
      awayRegistration: {
        include: {
          team: {
            select: {
              id: true,
              ownerId: true,
              members: {
                where: {
                  role: {
                    in: captainRoles
                  }
                },
                select: {
                  userId: true,
                  role: true
                }
              }
            }
          },
          user: {
            select: {
              id: true
            }
          }
        }
      }
    }
  });
}

export async function loadResultForAuthorization(resultId: string) {
  return prisma.matchResult.findUnique({
    where: { id: resultId },
    include: {
      match: {
        include: {
          tournament: {
            select: {
              id: true,
              organizerId: true,
              status: true,
              type: true
            }
          },
          homeRegistration: {
            include: {
              team: {
                select: {
                  id: true,
                  ownerId: true,
                  members: {
                    where: {
                      role: {
                        in: captainRoles
                      }
                    },
                    select: {
                      userId: true,
                      role: true
                    }
                  }
                }
              },
              user: {
                select: {
                  id: true
                }
              }
            }
          },
          awayRegistration: {
            include: {
              team: {
                select: {
                  id: true,
                  ownerId: true,
                  members: {
                    where: {
                      role: {
                        in: captainRoles
                      }
                    },
                    select: {
                      userId: true,
                      role: true
                    }
                  }
                }
              },
              user: {
                select: {
                  id: true
                }
              }
            }
          }
        }
      }
    }
  });
}

export function isMatchModerator(params: {
  userId: string;
  role: UserRole | string;
  organizerId: string;
}) {
  return (
    params.userId === params.organizerId ||
    params.role === "ADMIN" ||
    params.role === "SUPER_ADMIN" ||
    params.role === "MODERATOR"
  );
}

export function getRegistrationSide(match: Awaited<ReturnType<typeof loadMatchForAuthorization>>, userId: string) {
  const home = match?.homeRegistration;
  const away = match?.awayRegistration;

  if (home) {
    if (home.userId === userId || home.user?.id === userId) {
      return "home";
    }

    if (
      home.team?.ownerId === userId ||
      home.team?.members.some((member: { userId: string }) => member.userId === userId)
    ) {
      return "home";
    }
  }

  if (away) {
    if (away.userId === userId || away.user?.id === userId) {
      return "away";
    }

    if (
      away.team?.ownerId === userId ||
      away.team?.members.some((member: { userId: string }) => member.userId === userId)
    ) {
      return "away";
    }
  }

  return null;
}

export function validateWinnerForScores(params: {
  homeRegistrationId?: string | null;
  awayRegistrationId?: string | null;
  winnerRegistrationId?: string | null;
  homeScore: number;
  awayScore: number;
}) {
  if (params.homeScore === params.awayScore) {
    return false;
  }

  if (!params.winnerRegistrationId) {
    return false;
  }

  const expectedWinner =
    params.homeScore > params.awayScore ? params.homeRegistrationId : params.awayRegistrationId;

  return params.winnerRegistrationId === expectedWinner;
}

export function canParticipantAcceptResult(params: {
  actorSide: "home" | "away" | null;
  reporterSide: "home" | "away" | null;
  status: MatchResultStatus | string;
}) {
  return (
    params.status === "PENDING_CONFIRMATION" &&
    params.actorSide !== null &&
    params.reporterSide !== null &&
    params.actorSide !== params.reporterSide
  );
}
