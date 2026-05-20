import { Router } from "express";
import { InvitationStatus, TeamMemberRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import type { AuthenticatedRequest } from "../../types.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { getRequestIp } from "../../utils/request-ip.js";
import { getRequestParam } from "../../utils/request-param.js";
import { slugify } from "../../utils/slug.js";
import { createAuditLog } from "../audit/audit.service.js";
import { addTeamMemberSchema } from "./team-members.schemas.js";
import {
  createTeamInvitationSchema,
  respondTeamInvitationSchema
} from "./team-invitations.schemas.js";
import { teamSchema } from "./teams.schemas.js";

export const teamsRouter = Router();

teamsRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    const teams = await prisma.team.findMany({
      include: {
        members: true
      },
      orderBy: { createdAt: "desc" }
    });

    response.json(teams);
  })
);

teamsRouter.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const teamId = getRequestParam(request.params.id);

    if (!teamId) {
      throw new Error("Team id is required");
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          }
        },
        registrations: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                game: true,
                status: true
              }
            }
          }
        }
      }
    });

    if (!team) {
      throw new Error("Team not found");
    }

    response.json(team);
  })
);

teamsRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const payload = teamSchema.parse(request.body);
    const slug = payload.slug ? slugify(payload.slug) : slugify(payload.name);

    const team = await prisma.team.create({
      data: {
        name: payload.name,
        slug,
        tag: payload.tag,
        description: payload.description,
        ownerId: request.user!.sub,
        members: {
          create: {
            userId: request.user!.sub,
            role: TeamMemberRole.OWNER
          }
        }
      },
      include: { members: true }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "team.create",
      entityType: "team",
      entityId: team.id,
      after: team,
      ipAddress: getRequestIp(request)
    });

    response.status(201).json(team);
  })
);

teamsRouter.put(
  "/:id",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const teamId = getRequestParam(request.params.id);
    const payload = teamSchema.partial().parse(request.body);
    const existing = await prisma.team.findUnique({ where: { id: teamId } });

    if (!existing) {
      throw new Error("Team not found");
    }

    if (existing.ownerId !== request.user!.sub) {
      return response.status(403).json({ message: "Forbidden" });
    }

    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...payload,
        slug: payload.slug ? slugify(payload.slug) : existing.slug
      }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "team.update",
      entityType: "team",
      entityId: team.id,
      before: existing,
      after: team,
      ipAddress: getRequestIp(request)
    });

    response.json(team);
  })
);

teamsRouter.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const teamId = getRequestParam(request.params.id);
    const existing = await prisma.team.findUnique({ where: { id: teamId } });

    if (!existing) {
      throw new Error("Team not found");
    }

    if (existing.ownerId !== request.user!.sub) {
      return response.status(403).json({ message: "Forbidden" });
    }

    const team = await prisma.team.update({
      where: { id: teamId },
      data: { status: "ARCHIVED" }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "team.archive",
      entityType: "team",
      entityId: team.id,
      before: existing,
      after: team,
      ipAddress: getRequestIp(request)
    });

    response.json(team);
  })
);

teamsRouter.post(
  "/:id/members",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const teamId = getRequestParam(request.params.id);
    if (!teamId) {
      throw new Error("Team id is required");
    }
    const payload = addTeamMemberSchema.parse(request.body);
    const team = await prisma.team.findUnique({ where: { id: teamId } });

    if (!team) {
      throw new Error("Team not found");
    }

    if (team.ownerId !== request.user!.sub) {
      return response.status(403).json({ message: "Forbidden" });
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId,
        userId: payload.userId,
        role: payload.role as TeamMemberRole
      }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "team_member.add",
      entityType: "team_member",
      entityId: member.id,
      after: member,
      ipAddress: getRequestIp(request)
    });

    response.status(201).json(member);
  })
);

teamsRouter.delete(
  "/:id/members/:memberId",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const teamId = getRequestParam(request.params.id);
    const memberId = getRequestParam(request.params.memberId);
    if (!teamId || !memberId) {
      throw new Error("Team member path params are required");
    }
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    const existing = await prisma.teamMember.findUnique({ where: { id: memberId } });

    if (!team || !existing || existing.teamId !== teamId) {
      throw new Error("Team member not found");
    }

    if (team.ownerId !== request.user!.sub) {
      return response.status(403).json({ message: "Forbidden" });
    }

    await prisma.teamMember.delete({
      where: { id: memberId }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "team_member.remove",
      entityType: "team_member",
      entityId: existing.id,
      before: existing,
      ipAddress: getRequestIp(request)
    });

    response.status(204).send();
  })
);

teamsRouter.get(
  "/:id/invitations",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const teamId = getRequestParam(request.params.id);

    if (!teamId) {
      throw new Error("Team id is required");
    }

    const invitations = await prisma.teamInvitation.findMany({
      where: {
        teamId,
        OR: [{ invitedUserId: request.user!.sub }, { invitedByUserId: request.user!.sub }]
      },
      include: {
        invitedUser: {
          select: { id: true, username: true, displayName: true }
        },
        invitedByUser: {
          select: { id: true, username: true, displayName: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    response.json(invitations);
  })
);

teamsRouter.post(
  "/:id/invitations",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const teamId = getRequestParam(request.params.id);

    if (!teamId) {
      throw new Error("Team id is required");
    }

    const payload = createTeamInvitationSchema.parse(request.body);
    const team = await prisma.team.findUnique({ where: { id: teamId } });

    if (!team) {
      throw new Error("Team not found");
    }

    if (team.ownerId !== request.user!.sub) {
      return response.status(403).json({ message: "Forbidden" });
    }

    const existingMember = await prisma.teamMember.findFirst({
      where: { teamId, userId: payload.invitedUserId }
    });

    if (existingMember) {
      throw new Error("User is already a team member");
    }

    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId,
        invitedUserId: payload.invitedUserId,
        invitedByUserId: request.user!.sub,
        role: payload.role as TeamMemberRole,
        status: InvitationStatus.PENDING
      },
      include: {
        invitedUser: {
          select: { id: true, username: true, displayName: true }
        },
        invitedByUser: {
          select: { id: true, username: true, displayName: true }
        }
      }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "team_invitation.create",
      entityType: "team_invitation",
      entityId: invitation.id,
      after: invitation,
      ipAddress: getRequestIp(request)
    });

    response.status(201).json(invitation);
  })
);

teamsRouter.post(
  "/invitations/:invitationId/respond",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const invitationId = getRequestParam(request.params.invitationId);

    if (!invitationId) {
      throw new Error("Invitation id is required");
    }

    const payload = respondTeamInvitationSchema.parse(request.body);
    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.invitedUserId !== request.user!.sub) {
      return response.status(403).json({ message: "Forbidden" });
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new Error("Invitation has already been processed");
    }

    const nextStatus =
      payload.action === "ACCEPT" ? InvitationStatus.ACCEPTED : InvitationStatus.DECLINED;

    const updated = await prisma.teamInvitation.update({
      where: { id: invitationId },
      data: {
        status: nextStatus,
        respondedAt: new Date()
      }
    });

    if (payload.action === "ACCEPT") {
      await prisma.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId: invitation.invitedUserId,
          role: invitation.role
        }
      });
    }

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: payload.action === "ACCEPT" ? "team_invitation.accept" : "team_invitation.decline",
      entityType: "team_invitation",
      entityId: updated.id,
      before: invitation,
      after: updated,
      ipAddress: getRequestIp(request)
    });

    response.json(updated);
  })
);
