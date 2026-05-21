import { Router } from "express";
import { RegistrationStatus, TeamMemberRole, TournamentStatus } from "@prisma/client";
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

const activeRegistrationStatuses = [
  RegistrationStatus.PENDING,
  RegistrationStatus.CONFIRMED,
  RegistrationStatus.CHECKED_IN
];

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
  return params.user.role === "ADMIN" || params.user.role === "SUPER_ADMIN" || params.user.sub === params.organizerId;
}

function assertCanManageTournament(user: AuthUser, organizerId: string) {
  if (!canManageTournament({ user, organizerId })) {
    throw forbidden("Only the tournament organizer or an admin can manage this tournament");
  }
}

async function assertTeamRegistrationAllowed(teamId: string, user: AuthUser) {
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "ORGANIZER") {
    return;
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        where: {
          userId: user.sub,
          role: { in: [TeamMemberRole.OWNER, TeamMemberRole.CAPTAIN] }
        }
      }
    }
  });

  if (!team) {
    throw notFound("Team not found");
  }

  if (team.ownerId !== user.sub && team.members.length === 0) {
    throw forbidden("Only team owners or captains can register a team");
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

  if (tournament.type === "TEAM") {
    if (!params.teamId) {
      throw badRequest("Team registration requires teamId");
    }

    await assertTeamRegistrationAllowed(params.teamId, params.request.user!);
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
        registrationClosesAt: parseOptionalDate(payload.registrationClosesAt),
        startsAt: parseOptionalDate(payload.startsAt),
        endsAt: parseOptionalDate(payload.endsAt),
        status: payload.status
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

    if (existing.status === TournamentStatus.IN_PROGRESS && !["ADMIN", "SUPER_ADMIN"].includes(request.user!.role)) {
      throw badRequest("Only admins can edit tournaments that are in progress");
    }

    const tournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        ...payload,
        slug: payload.slug ? slugify(payload.slug) : existing.slug,
        registrationClosesAt: parseOptionalDate(payload.registrationClosesAt),
        startsAt: parseOptionalDate(payload.startsAt),
        endsAt: parseOptionalDate(payload.endsAt)
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
    const tournamentId = requireRouteParam(request.params.id, "Tournament id");
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) {
      throw notFound("Tournament not found");
    }

    assertCanManageTournament(request.user!, tournament.organizerId);

    const bracket = await generateSingleEliminationBracket({ tournamentId: tournament.id });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "bracket.generate",
      entityType: "bracket",
      entityId: bracket?.id,
      after: bracket,
      ipAddress: getRequestIp(request)
    });

    response.status(201).json(bracket);
  })
);

tournamentsRouter.post(
  "/:id/generate-bracket",
  requireAuth,
  requireRole(["ORGANIZER", "ADMIN", "SUPER_ADMIN"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const tournamentId = requireRouteParam(request.params.id, "Tournament id");
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) {
      throw notFound("Tournament not found");
    }

    assertCanManageTournament(request.user!, tournament.organizerId);

    const bracket = await generateSingleEliminationBracket({ tournamentId: tournament.id });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "bracket.generate",
      entityType: "bracket",
      entityId: bracket?.id,
      after: bracket,
      ipAddress: getRequestIp(request)
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
