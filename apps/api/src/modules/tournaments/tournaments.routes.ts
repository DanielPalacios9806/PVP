import { Router } from "express";
import { RegistrationStatus, TeamMemberRole, TeamStatus, TournamentStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import type { AuthenticatedRequest, AuthUser } from "../../types.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { badRequest, conflict, forbidden, notFound } from "../../utils/http-error.js";
import { getRequestIp } from "../../utils/request-ip.js";
import { getRequestParam } from "../../utils/request-param.js";
import { slugify } from "../../utils/slug.js";
import { createAuditLog } from "../audit/audit.service.js";
import { generateSingleEliminationBracket } from "../brackets/brackets.service.js";
import { checkInSchema, matchSchema, registrationSchema, tournamentSchema } from "./tournaments.schemas.js";

export const tournamentsRouter = Router();

const activeRegistrationStatuses: RegistrationStatus[] = [
  RegistrationStatus.PENDING,
  RegistrationStatus.CONFIRMED,
  RegistrationStatus.CHECKED_IN
];

const bracketEligibleRegistrationStatuses = [
  RegistrationStatus.CONFIRMED,
  RegistrationStatus.CHECKED_IN
];

const checkedInRegistrationStatuses = [RegistrationStatus.CHECKED_IN];

const initialTournamentStatuses: TournamentStatus[] = [
  TournamentStatus.DRAFT,
  TournamentStatus.PUBLISHED,
  TournamentStatus.REGISTRATION_OPEN
];

const bracketBlockedStatuses: TournamentStatus[] = [
  TournamentStatus.DRAFT,
  TournamentStatus.PUBLISHED,
  TournamentStatus.REGISTRATION_OPEN
];

const terminalTournamentStatuses: TournamentStatus[] = [TournamentStatus.COMPLETED, TournamentStatus.CANCELLED];

const restrictedEditTournamentStatuses: TournamentStatus[] = [
  TournamentStatus.IN_PROGRESS,
  TournamentStatus.COMPLETED,
  TournamentStatus.CANCELLED
];

const teamRegistrationManagerRoles: TeamMemberRole[] = [TeamMemberRole.OWNER, TeamMemberRole.CAPTAIN];

const allowedTournamentStatusTransitions: Record<TournamentStatus, TournamentStatus[]> = {
  [TournamentStatus.DRAFT]: [TournamentStatus.PUBLISHED, TournamentStatus.REGISTRATION_OPEN, TournamentStatus.CANCELLED],
  [TournamentStatus.PUBLISHED]: [
    TournamentStatus.REGISTRATION_OPEN,
    TournamentStatus.REGISTRATION_CLOSED,
    TournamentStatus.CANCELLED
  ],
  [TournamentStatus.REGISTRATION_OPEN]: [
    TournamentStatus.REGISTRATION_CLOSED,
    TournamentStatus.CHECK_IN,
    TournamentStatus.IN_PROGRESS,
    TournamentStatus.CANCELLED
  ],
  [TournamentStatus.REGISTRATION_CLOSED]: [
    TournamentStatus.REGISTRATION_OPEN,
    TournamentStatus.CHECK_IN,
    TournamentStatus.IN_PROGRESS,
    TournamentStatus.CANCELLED
  ],
  [TournamentStatus.CHECK_IN]: [
    TournamentStatus.REGISTRATION_CLOSED,
    TournamentStatus.IN_PROGRESS,
    TournamentStatus.CANCELLED
  ],
  [TournamentStatus.IN_PROGRESS]: [TournamentStatus.COMPLETED, TournamentStatus.CANCELLED],
  [TournamentStatus.COMPLETED]: [],
  [TournamentStatus.CANCELLED]: []
};

function assertTournamentCapacityRules(params: { minParticipants?: number | null; maxParticipants: number }) {
  const minParticipants = params.minParticipants ?? 1;

  if (minParticipants > params.maxParticipants) {
    throw badRequest("Minimum participants cannot be greater than maximum participants");
  }
}

function assertTournamentScheduleRules(params: {
  registrationClosesAt?: Date;
  startsAt?: Date;
  endsAt?: Date;
}) {
  if (params.registrationClosesAt && params.startsAt && params.registrationClosesAt > params.startsAt) {
    throw badRequest("Registration close date must be before the tournament start date");
  }

  if (params.startsAt && params.endsAt && params.startsAt > params.endsAt) {
    throw badRequest("Tournament start date must be before the end date");
  }
}

function assertCreateStatusAllowed(status?: TournamentStatus) {
  if (
    status &&
    !initialTournamentStatuses.includes(status)
  ) {
    throw badRequest("New tournaments can only start as draft, published or registration open");
  }
}

function assertStatusTransitionAllowed(from: TournamentStatus, to: TournamentStatus) {
  if (from === to) {
    return;
  }

  if (!allowedTournamentStatusTransitions[from].includes(to)) {
    throw badRequest(`Invalid tournament status transition from ${from} to ${to}`);
  }
}

async function countEligibleRegistrations(tournamentId: string, statuses = bracketEligibleRegistrationStatuses) {
  return prisma.tournamentRegistration.count({
    where: {
      tournamentId,
      status: { in: statuses }
    }
  });
}

async function assertTournamentCanReceiveStatus(tournament: {
  id: string;
  status: TournamentStatus;
  registrationClosesAt: Date | null;
  startsAt: Date | null;
  minParticipants: number | null;
  checkInEnabled: boolean;
}, nextStatus: TournamentStatus) {
  assertStatusTransitionAllowed(tournament.status, nextStatus);

  if (nextStatus === TournamentStatus.REGISTRATION_OPEN) {
    if (tournament.registrationClosesAt && tournament.registrationClosesAt < new Date()) {
      throw badRequest("Registration cannot be opened because the deadline has already passed");
    }
  }

  if (nextStatus === TournamentStatus.CHECK_IN) {
    if (!tournament.checkInEnabled) {
      throw badRequest("Check-in is not enabled for this tournament");
    }

    const eligibleCount = await countEligibleRegistrations(tournament.id);

    if (eligibleCount < (tournament.minParticipants ?? 1)) {
      throw badRequest("Not enough confirmed participants to open check-in");
    }
  }

  if (nextStatus === TournamentStatus.IN_PROGRESS) {
    const statuses = tournament.checkInEnabled ? checkedInRegistrationStatuses : bracketEligibleRegistrationStatuses;
    const eligibleCount = await countEligibleRegistrations(tournament.id, statuses);

    if (eligibleCount < (tournament.minParticipants ?? 1)) {
      throw badRequest("Not enough eligible participants to start the tournament");
    }

    if (tournament.startsAt && tournament.startsAt > new Date() && tournament.status !== TournamentStatus.IN_PROGRESS) {
      throw badRequest("Tournament cannot start before its scheduled start date");
    }
  }

  if (nextStatus === TournamentStatus.COMPLETED && tournament.status !== TournamentStatus.IN_PROGRESS) {
    throw badRequest("Only tournaments in progress can be completed");
  }
}

async function assertTournamentReadyForBracket(tournament: {
  id: string;
  status: TournamentStatus;
  minParticipants: number | null;
  checkInEnabled: boolean;
}) {
  if (bracketBlockedStatuses.includes(tournament.status)) {
    throw badRequest("Close registration or open check-in before generating the bracket");
  }

  if (terminalTournamentStatuses.includes(tournament.status)) {
    throw badRequest("Cannot generate a bracket for a completed or cancelled tournament");
  }

  const existingBracket = await prisma.bracket.findUnique({
    where: { tournamentId: tournament.id }
  });

  if (existingBracket) {
    throw conflict("A bracket has already been generated for this tournament");
  }

  const statuses = tournament.checkInEnabled ? checkedInRegistrationStatuses : bracketEligibleRegistrationStatuses;
  const eligibleCount = await countEligibleRegistrations(tournament.id, statuses);

  if (eligibleCount < (tournament.minParticipants ?? 1)) {
    throw badRequest("Not enough eligible participants to generate a bracket");
  }
}

function parseOptionalDate(value?: string) {
  return value ? new Date(value) : undefined;
}

function requireRouteParam(value: string | string[] | undefined, name: string) {
  const param = getRequestParam(value);
  if (!param) {
    throw badRequest(`${name} is required`);
  }

  return param;
}

function canManageTournament(params: { user: AuthUser; organizerId: string }) {
  return (
    params.user.role === "ADMIN" ||
    params.user.role === "SUPER_ADMIN" ||
    (params.user.role === "ORGANIZER" && params.user.sub === params.organizerId)
  );
}

function assertCanManageTournament(user: AuthUser, organizerId: string) {
  if (!canManageTournament({ user, organizerId })) {
    throw forbidden("Only the tournament organizer or an admin can manage this tournament");
  }
}

async function assertTeamRegistrationAllowed(teamId: string, user: AuthUser) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: true
    }
  });

  if (!team) {
    throw notFound("Team not found");
  }

  if (team.status !== TeamStatus.ACTIVE) {
    throw badRequest("Only active teams can register for tournaments");
  }

  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    return team;
  }

  const canRegisterTeam =
    team.ownerId === user.sub ||
    team.members.some(
      (member) =>
        member.userId === user.sub &&
        teamRegistrationManagerRoles.includes(member.role)
    );

  if (!canRegisterTeam) {
    throw forbidden("Only team owners or captains can register a team");
  }

  return team;
}


function buildTournamentWindow(tournament: { startsAt: Date | null; endsAt: Date | null }) {
  if (!tournament.startsAt) {
    return null;
  }

  const start = tournament.startsAt;
  const end = tournament.endsAt ?? new Date(start.getTime() + 2 * 60 * 60 * 1000);

  return {
    start,
    end
  };
}

function tournamentWindowsOverlap(
  current: { startsAt: Date | null; endsAt: Date | null },
  candidate: { startsAt: Date | null; endsAt: Date | null }
) {
  const currentWindow = buildTournamentWindow(current);
  const candidateWindow = buildTournamentWindow(candidate);

  if (!currentWindow || !candidateWindow) {
    return false;
  }

  return currentWindow.start < candidateWindow.end && candidateWindow.start < currentWindow.end;
}

async function assertNoParticipantScheduleConflict(params: {
  tournament: { id: string; name: string; startsAt: Date | null; endsAt: Date | null };
  participantUserIds: string[];
}) {
  if (!params.participantUserIds.length || !params.tournament.startsAt) {
    return;
  }

  const conflictingRegistration = await prisma.tournamentRegistration.findFirst({
    where: {
      tournamentId: { not: params.tournament.id },
      status: { in: activeRegistrationStatuses },
      tournament: {
        startsAt: { not: null },
        status: {
          notIn: terminalTournamentStatuses
        }
      },
      OR: [
        {
          userId: { in: params.participantUserIds }
        },
        {
          team: {
            members: {
              some: {
                userId: { in: params.participantUserIds }
              }
            }
          }
        }
      ]
    },
    include: {
      tournament: {
        select: {
          id: true,
          name: true,
          startsAt: true,
          endsAt: true
        }
      }
    }
  });

  if (
    conflictingRegistration?.tournament &&
    tournamentWindowsOverlap(params.tournament, conflictingRegistration.tournament)
  ) {
    throw conflict(`Participant already has an active tournament at the same time: ${conflictingRegistration.tournament.name}`);
  }
}


async function createTournamentRegistration(params: {
  request: AuthenticatedRequest;
  tournamentId: string;
  userId?: string;
  teamId?: string;
}) {
  const tournament = await prisma.tournament.findUnique({ where: { id: params.tournamentId } });

  if (!tournament) {
    throw notFound("Tournament not found");
  }

  if (tournament.status !== TournamentStatus.REGISTRATION_OPEN) {
    throw badRequest("Tournament registration is not open");
  }

  if (tournament.registrationClosesAt && tournament.registrationClosesAt < new Date()) {
    throw badRequest("Tournament registration deadline has passed");
  }

  let registeringTeam: Awaited<ReturnType<typeof assertTeamRegistrationAllowed>> | null = null;

  if (tournament.type === "TEAM") {
    if (!params.teamId) {
      throw badRequest("Team registration requires teamId");
    }

    registeringTeam = await assertTeamRegistrationAllowed(params.teamId, params.request.user!);

    if (tournament.teamSize && registeringTeam.members.length < tournament.teamSize) {
      throw badRequest("Team does not meet the required roster size for this tournament");
    }
  }

  if (tournament.type === "SOLO" && params.teamId) {
    throw badRequest("Solo tournaments do not accept team registrations");
  }

  if (tournament.type === "SOLO" && params.userId && params.userId !== params.request.user!.sub) {
    if (!["ADMIN", "SUPER_ADMIN", "ORGANIZER"].includes(params.request.user!.role)) {
      throw forbidden("Users can only register themselves");
    }
  }

  const participantFilter =
    tournament.type === "TEAM"
      ? { teamId: params.teamId }
      : { userId: params.userId ?? params.request.user!.sub };

  const existingRegistration = await prisma.tournamentRegistration.findFirst({
    where: {
      tournamentId: tournament.id,
      ...participantFilter,
      status: { in: activeRegistrationStatuses }
    }
  });

  if (existingRegistration) {
    throw conflict("Participant is already registered for this tournament");
  }

  const activeCount = await prisma.tournamentRegistration.count({
    where: {
      tournamentId: tournament.id,
      status: { in: activeRegistrationStatuses }
    }
  });

  if (activeCount >= tournament.maxParticipants) {
    throw badRequest("Tournament registration capacity has been reached");
  }

  const participantUserIds =
    tournament.type === "TEAM"
      ? registeringTeam?.members.map((member) => member.userId) ?? []
      : [params.userId ?? params.request.user!.sub];

  await assertNoParticipantScheduleConflict({
    tournament,
    participantUserIds
  });

  const registration = await prisma.tournamentRegistration.create({
    data: {
      tournamentId: tournament.id,
      userId: tournament.type === "SOLO" ? params.userId ?? params.request.user!.sub : null,
      teamId: tournament.type === "TEAM" ? params.teamId : null,
      status: RegistrationStatus.PENDING
    }
  });

  await createAuditLog({
    actorUserId: params.request.user!.sub,
    action: "tournament.register",
    entityType: "tournament_registration",
    entityId: registration.id,
    after: registration,
    ipAddress: getRequestIp(params.request)
  });

  return registration;
}

async function updateTournamentStatus(params: {
  request: AuthenticatedRequest;
  tournamentId: string;
  status: TournamentStatus;
  action: string;
}) {
  const existing = await prisma.tournament.findUnique({ where: { id: params.tournamentId } });

  if (!existing) {
    throw notFound("Tournament not found");
  }

  assertCanManageTournament(params.request.user!, existing.organizerId);
  await assertTournamentCanReceiveStatus(existing, params.status);

  const tournament = await prisma.tournament.update({
    where: { id: existing.id },
    data: { status: params.status }
  });

  await createAuditLog({
    actorUserId: params.request.user!.sub,
    action: params.action,
    entityType: "tournament",
    entityId: tournament.id,
    before: { status: existing.status },
    after: { status: tournament.status },
    ipAddress: getRequestIp(params.request)
  });

  return tournament;
}

async function updateRegistrationDecision(params: {
  request: AuthenticatedRequest;
  tournamentId: string;
  registrationId: string;
  status: "CONFIRMED" | "REJECTED";
  reason?: string;
}) {
  const registration = await prisma.tournamentRegistration.findUnique({
    where: { id: params.registrationId },
    include: {
      tournament: true,
      team: { select: { id: true, name: true, tag: true } },
      user: { select: { id: true, username: true, displayName: true } }
    }
  });

  if (!registration || registration.tournamentId !== params.tournamentId) {
    throw notFound("Tournament registration not found");
  }

  assertCanManageTournament(params.request.user!, registration.tournament.organizerId);

  if (terminalTournamentStatuses.includes(registration.tournament.status)) {
    throw badRequest("Cannot modify registrations for completed or cancelled tournaments");
  }

  if (registration.status === RegistrationStatus.CHECKED_IN) {
    throw badRequest("Checked-in registrations cannot be changed from the operations panel");
  }

  if (params.status === RegistrationStatus.CONFIRMED && registration.status !== RegistrationStatus.CONFIRMED) {
    const activeCount = await prisma.tournamentRegistration.count({
      where: {
        tournamentId: registration.tournamentId,
        status: { in: activeRegistrationStatuses }
      }
    });

    if (!activeRegistrationStatuses.includes(registration.status) && activeCount >= registration.tournament.maxParticipants) {
      throw badRequest("Tournament registration capacity has been reached");
    }
  }

  const updated = await prisma.tournamentRegistration.update({
    where: { id: registration.id },
    data: {
      status: params.status,
      approvedByUserId: params.status === RegistrationStatus.CONFIRMED ? params.request.user!.sub : registration.approvedByUserId,
      approvedAt: params.status === RegistrationStatus.CONFIRMED ? new Date() : registration.approvedAt,
      rejectedReason: params.status === RegistrationStatus.REJECTED ? params.reason?.trim() || "Rechazado desde panel operativo" : null
    },
    include: {
      team: { select: { id: true, name: true, tag: true } },
      user: { select: { id: true, username: true, displayName: true } }
    }
  });

  await createAuditLog({
    actorUserId: params.request.user!.sub,
    action: params.status === RegistrationStatus.CONFIRMED ? "tournament.registration.approve" : "tournament.registration.reject",
    entityType: "tournament_registration",
    entityId: updated.id,
    before: registration,
    after: updated,
    ipAddress: getRequestIp(params.request)
  });

  return updated;
}

async function generateBracketForTournament(params: { request: AuthenticatedRequest; tournamentId: string }) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.tournamentId }
  });

  if (!tournament) {
    throw notFound("Tournament not found");
  }

  assertCanManageTournament(params.request.user!, tournament.organizerId);
  await assertTournamentReadyForBracket(tournament);

  const bracket = await generateSingleEliminationBracket({ tournamentId: tournament.id });

  await createAuditLog({
    actorUserId: params.request.user!.sub,
    action: "bracket.generate",
    entityType: "bracket",
    entityId: bracket?.id,
    after: bracket,
    ipAddress: getRequestIp(params.request)
  });

  return bracket;
}


tournamentsRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    const tournaments = await prisma.tournament.findMany({
      include: {
        registrations: true,
        bracket: {
          include: {
            rounds: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    response.json(tournaments);
  })
);

tournamentsRouter.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const tournamentId = requireRouteParam(request.params.id, "Tournament id");

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        space: true,
        organizer: {
          select: {
            id: true,
            username: true,
            displayName: true,
            role: true
          }
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            },
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
                tag: true
              }
            }
          }
        },
        bracket: {
          include: {
            rounds: {
              orderBy: { sequence: "asc" },
              include: {
                matches: {
                  orderBy: { createdAt: "asc" },
                  include: {
                    homeRegistration: {
                      include: {
                        user: { select: { id: true, displayName: true, username: true } },
                        team: { select: { id: true, name: true, tag: true } }
                      }
                    },
                    awayRegistration: {
                      include: {
                        user: { select: { id: true, displayName: true, username: true } },
                        team: { select: { id: true, name: true, tag: true } }
                      }
                    },
                    winnerRegistration: {
                      include: {
                        user: { select: { id: true, displayName: true, username: true } },
                        team: { select: { id: true, name: true, tag: true } }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        matches: {
          orderBy: { createdAt: "desc" },
          take: 10
        }
      }
    });

    if (!tournament) {
      throw notFound("Tournament not found");
    }

    response.json(tournament);
  })
);

tournamentsRouter.post(
  "/",
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const payload = tournamentSchema.parse(request.body);
    const slug = payload.slug ? slugify(payload.slug) : slugify(payload.name);
    const registrationClosesAt = parseOptionalDate(payload.registrationClosesAt);
    const startsAt = parseOptionalDate(payload.startsAt);
    const endsAt = parseOptionalDate(payload.endsAt);

    assertCreateStatusAllowed(payload.status);
    assertTournamentCapacityRules({
      minParticipants: payload.minParticipants,
      maxParticipants: payload.maxParticipants
    });
    assertTournamentScheduleRules({
      registrationClosesAt,
      startsAt,
      endsAt
    });

    const tournament = await prisma.tournament.create({
      data: {
        spaceId: payload.spaceId,
        organizerId: request.user!.sub,
        name: payload.name,
        slug,
        game: payload.game,
        platformRoute: payload.platformRoute,
        regionalRoute: payload.regionalRoute,
        teamSize: payload.teamSize,
        format: payload.format,
        type: payload.type,
        rules: payload.rules,
        publicRules: payload.publicRules,
        prizes: payload.prizes,
        entryFeeTokens: payload.entryFeeTokens,
        maxParticipants: payload.maxParticipants,
        minParticipants: payload.minParticipants,
        checkInEnabled: payload.checkInEnabled,
        registrationClosesAt,
        startsAt,
        endsAt,
        status: payload.status ?? TournamentStatus.DRAFT
      }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "tournament.create",
      entityType: "tournament",
      entityId: tournament.id,
      after: tournament,
      ipAddress: getRequestIp(request)
    });

    response.status(201).json(tournament);
  })
);

tournamentsRouter.put(
  "/:id",
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const tournamentId = requireRouteParam(request.params.id, "Tournament id");
    const payload = tournamentSchema.partial().parse(request.body);
    const existing = await prisma.tournament.findUnique({ where: { id: tournamentId } });

    if (!existing) {
      throw notFound("Tournament not found");
    }

    assertCanManageTournament(request.user!, existing.organizerId);

    if (
      restrictedEditTournamentStatuses.includes(existing.status) &&
      !["ADMIN", "SUPER_ADMIN"].includes(request.user!.role)
    ) {
      throw badRequest("Only admins can edit tournaments that are in progress, completed or cancelled");
    }

    const registrationClosesAt = parseOptionalDate(payload.registrationClosesAt);
    const startsAt = parseOptionalDate(payload.startsAt);
    const endsAt = parseOptionalDate(payload.endsAt);

    assertTournamentCapacityRules({
      minParticipants: payload.minParticipants ?? existing.minParticipants,
      maxParticipants: payload.maxParticipants ?? existing.maxParticipants
    });
    assertTournamentScheduleRules({
      registrationClosesAt: registrationClosesAt ?? existing.registrationClosesAt ?? undefined,
      startsAt: startsAt ?? existing.startsAt ?? undefined,
      endsAt: endsAt ?? existing.endsAt ?? undefined
    });

    if (payload.status) {
      await assertTournamentCanReceiveStatus(existing, payload.status);
    }

    const tournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        ...payload,
        slug: payload.slug ? slugify(payload.slug) : existing.slug,
        registrationClosesAt,
        startsAt,
        endsAt
      }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "tournament.update",
      entityType: "tournament",
      entityId: tournament.id,
      before: existing,
      after: tournament,
      ipAddress: getRequestIp(request)
    });

    response.json(tournament);
  })
);

tournamentsRouter.post(
  "/:id/publish",
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const tournament = await updateTournamentStatus({
      request,
      tournamentId: requireRouteParam(request.params.id, "Tournament id"),
      status: TournamentStatus.PUBLISHED,
      action: "tournament.publish"
    });

    response.json(tournament);
  })
);

tournamentsRouter.post(
  "/:id/open-registration",
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const tournament = await updateTournamentStatus({
      request,
      tournamentId: requireRouteParam(request.params.id, "Tournament id"),
      status: TournamentStatus.REGISTRATION_OPEN,
      action: "tournament.registration.open"
    });

    response.json(tournament);
  })
);

tournamentsRouter.post(
  "/:id/close-registration",
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const tournament = await updateTournamentStatus({
      request,
      tournamentId: requireRouteParam(request.params.id, "Tournament id"),
      status: TournamentStatus.REGISTRATION_CLOSED,
      action: "tournament.registration.close"
    });

    response.json(tournament);
  })
);

tournamentsRouter.post(
  "/:id/open-check-in",
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const tournament = await updateTournamentStatus({
      request,
      tournamentId: requireRouteParam(request.params.id, "Tournament id"),
      status: TournamentStatus.CHECK_IN,
      action: "tournament.check_in.open"
    });

    response.json(tournament);
  })
);

tournamentsRouter.post(
  "/:id/start",
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const tournament = await updateTournamentStatus({
      request,
      tournamentId: requireRouteParam(request.params.id, "Tournament id"),
      status: TournamentStatus.IN_PROGRESS,
      action: "tournament.start"
    });

    response.json(tournament);
  })
);

tournamentsRouter.post(
  "/:id/complete",
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const tournament = await updateTournamentStatus({
      request,
      tournamentId: requireRouteParam(request.params.id, "Tournament id"),
      status: TournamentStatus.COMPLETED,
      action: "tournament.complete"
    });

    response.json(tournament);
  })
);

tournamentsRouter.post(
  "/:id/register",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const payload = registrationSchema.parse(request.body);
    const registration = await createTournamentRegistration({
      request,
      tournamentId: requireRouteParam(request.params.id, "Tournament id"),
      userId: payload.userId,
      teamId: payload.teamId
    });

    response.status(201).json(registration);
  })
);

tournamentsRouter.post(
  "/:id/register-team",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const payload = registrationSchema.parse(request.body);
    const registration = await createTournamentRegistration({
      request,
      tournamentId: requireRouteParam(request.params.id, "Tournament id"),
      teamId: payload.teamId
    });

    response.status(201).json(registration);
  })
);

tournamentsRouter.post(
  "/:id/register-player",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const payload = registrationSchema.parse(request.body);
    const registration = await createTournamentRegistration({
      request,
      tournamentId: requireRouteParam(request.params.id, "Tournament id"),
      userId: payload.userId ?? request.user!.sub
    });

    response.status(201).json(registration);
  })
);

tournamentsRouter.post(
  "/:id/registrations/:registrationId/approve",
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const updated = await updateRegistrationDecision({
      request,
      tournamentId: requireRouteParam(request.params.id, "Tournament id"),
      registrationId: requireRouteParam(request.params.registrationId, "Registration id"),
      status: RegistrationStatus.CONFIRMED
    });

    response.json(updated);
  })
);

tournamentsRouter.post(
  "/:id/registrations/:registrationId/reject",
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const reason = typeof request.body?.reason === "string" ? request.body.reason : undefined;
    const updated = await updateRegistrationDecision({
      request,
      tournamentId: requireRouteParam(request.params.id, "Tournament id"),
      registrationId: requireRouteParam(request.params.registrationId, "Registration id"),
      status: RegistrationStatus.REJECTED,
      reason
    });

    response.json(updated);
  })
);

tournamentsRouter.post(
  "/:id/check-in",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const tournamentId = requireRouteParam(request.params.id, "Tournament id");
    const payload = checkInSchema.parse(request.body);
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    const registration = await prisma.tournamentRegistration.findUnique({
      where: { id: payload.registrationId },
      include: {
        team: {
          include: {
            members: {
              where: {
                userId: request.user!.sub,
                role: { in: [TeamMemberRole.OWNER, TeamMemberRole.CAPTAIN] }
              }
            }
          }
        }
      }
    });

    if (!tournament || !registration || registration.tournamentId !== tournamentId) {
      throw notFound("Tournament registration not found");
    }

    if (!tournament.checkInEnabled) {
      throw badRequest("Check-in is not enabled for this tournament");
    }

    if (tournament.status !== TournamentStatus.CHECK_IN) {
      throw badRequest("Tournament is not in check-in status");
    }

    if (registration.status !== RegistrationStatus.CONFIRMED) {
      throw badRequest("Only confirmed registrations can check in");
    }

    const canCheckIn =
      registration.userId === request.user!.sub ||
      registration.team?.ownerId === request.user!.sub ||
      Boolean(registration.team?.members.length) ||
      request.user!.role === "ADMIN" ||
      request.user!.role === "SUPER_ADMIN" ||
      tournament.organizerId === request.user!.sub;

    if (!canCheckIn) {
      throw forbidden("Only the participant, team captain, organizer or admin can check in");
    }

    const checkedIn = await prisma.tournamentRegistration.update({
      where: { id: registration.id },
      data: {
        status: RegistrationStatus.CHECKED_IN,
        checkedInAt: new Date()
      }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "tournament.check_in",
      entityType: "tournament_registration",
      entityId: checkedIn.id,
      before: registration,
      after: checkedIn,
      ipAddress: getRequestIp(request)
    });

    response.json(checkedIn);
  })
);

tournamentsRouter.post(
  "/:id/bracket",
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const bracket = await generateBracketForTournament({
      request,
      tournamentId: requireRouteParam(request.params.id, "Tournament id")
    });

    response.status(201).json(bracket);
  })
);

tournamentsRouter.post(
  "/:id/generate-bracket",
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const bracket = await generateBracketForTournament({
      request,
      tournamentId: requireRouteParam(request.params.id, "Tournament id")
    });

    response.status(201).json(bracket);
  })
);

tournamentsRouter.post(
  "/:id/matches",
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const tournamentId = requireRouteParam(request.params.id, "Tournament id");
    const payload = matchSchema.parse(request.body);
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });

    if (!tournament) {
      throw notFound("Tournament not found");
    }

    assertCanManageTournament(request.user!, tournament.organizerId);

    if (terminalTournamentStatuses.includes(tournament.status)) {
      throw badRequest("Cannot create matches for completed or cancelled tournaments");
    }

    const match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        roundId: payload.roundId,
        homeRegistrationId: payload.homeRegistrationId,
        awayRegistrationId: payload.awayRegistrationId,
        scheduledAt: parseOptionalDate(payload.scheduledAt),
        bestOf: payload.bestOf,
        status: payload.status
      }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "match.create",
      entityType: "match",
      entityId: match.id,
      after: match,
      ipAddress: getRequestIp(request)
    });

    response.status(201).json(match);
  })
);

tournamentsRouter.delete(
  "/:id",
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const tournamentId = requireRouteParam(request.params.id, "Tournament id");
    const existing = await prisma.tournament.findUnique({ where: { id: tournamentId } });

    if (!existing) {
      throw notFound("Tournament not found");
    }

    assertCanManageTournament(request.user!, existing.organizerId);

    if (terminalTournamentStatuses.includes(existing.status)) {
      throw badRequest("Completed or already cancelled tournaments cannot be cancelled");
    }

    const tournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: TournamentStatus.CANCELLED }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "tournament.cancel",
      entityType: "tournament",
      entityId: tournament.id,
      before: existing,
      after: tournament,
      ipAddress: getRequestIp(request)
    });

    response.json(tournament);
  })
);
