import { Router } from "express";
import { InvitationStatus, SpaceMemberRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import type { AuthenticatedRequest } from "../../types.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { getRequestIp } from "../../utils/request-ip.js";
import { getRequestParam } from "../../utils/request-param.js";
import { slugify } from "../../utils/slug.js";
import { createAuditLog } from "../audit/audit.service.js";
import { addSpaceMemberSchema } from "./space-members.schemas.js";
import {
  createSpaceInvitationSchema,
  respondSpaceInvitationSchema
} from "./space-invitations.schemas.js";
import { spaceSchema } from "./spaces.schemas.js";

export const spacesRouter = Router();

spacesRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    const spaces = await prisma.space.findMany({
      include: { members: true },
      orderBy: { createdAt: "desc" }
    });

    response.json(spaces);
  })
);

spacesRouter.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const spaceId = getRequestParam(request.params.id);

    if (!spaceId) {
      throw new Error("Space id is required");
    }

    const space = await prisma.space.findUnique({
      where: { id: spaceId },
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
        tournaments: {
          select: {
            id: true,
            name: true,
            game: true,
            status: true
          }
        }
      }
    });

    if (!space) {
      throw new Error("Space not found");
    }

    response.json(space);
  })
);

spacesRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const payload = spaceSchema.parse(request.body);
    const slug = payload.slug ? slugify(payload.slug) : slugify(payload.name);

    const space = await prisma.space.create({
      data: {
        name: payload.name,
        slug,
        description: payload.description,
        visibility: payload.visibility,
        ownerId: request.user!.sub,
        members: {
          create: {
            userId: request.user!.sub,
            role: SpaceMemberRole.OWNER
          }
        }
      },
      include: { members: true }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "space.create",
      entityType: "space",
      entityId: space.id,
      after: space,
      ipAddress: getRequestIp(request)
    });

    response.status(201).json(space);
  })
);

spacesRouter.put(
  "/:id",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const spaceId = getRequestParam(request.params.id);
    const payload = spaceSchema.partial().parse(request.body);
    const existing = await prisma.space.findUnique({ where: { id: spaceId } });

    if (!existing) {
      throw new Error("Space not found");
    }

    if (existing.ownerId !== request.user!.sub) {
      return response.status(403).json({ message: "Forbidden" });
    }

    const space = await prisma.space.update({
      where: { id: spaceId },
      data: {
        ...payload,
        slug: payload.slug ? slugify(payload.slug) : existing.slug
      }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "space.update",
      entityType: "space",
      entityId: space.id,
      before: existing,
      after: space,
      ipAddress: getRequestIp(request)
    });

    response.json(space);
  })
);

spacesRouter.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const spaceId = getRequestParam(request.params.id);
    const existing = await prisma.space.findUnique({ where: { id: spaceId } });

    if (!existing) {
      throw new Error("Space not found");
    }

    if (existing.ownerId !== request.user!.sub) {
      return response.status(403).json({ message: "Forbidden" });
    }

    const space = await prisma.space.update({
      where: { id: spaceId },
      data: { status: "ARCHIVED" }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "space.archive",
      entityType: "space",
      entityId: space.id,
      before: existing,
      after: space,
      ipAddress: getRequestIp(request)
    });

    response.json(space);
  })
);

spacesRouter.post(
  "/:id/members",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const spaceId = getRequestParam(request.params.id);
    if (!spaceId) {
      throw new Error("Space id is required");
    }
    const payload = addSpaceMemberSchema.parse(request.body);
    const space = await prisma.space.findUnique({ where: { id: spaceId } });

    if (!space) {
      throw new Error("Space not found");
    }

    if (space.ownerId !== request.user!.sub) {
      return response.status(403).json({ message: "Forbidden" });
    }

    const member = await prisma.spaceMember.create({
      data: {
        spaceId,
        userId: payload.userId,
        role: payload.role
      }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "space_member.add",
      entityType: "space_member",
      entityId: member.id,
      after: member,
      ipAddress: getRequestIp(request)
    });

    response.status(201).json(member);
  })
);

spacesRouter.delete(
  "/:id/members/:memberId",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const spaceId = getRequestParam(request.params.id);
    const memberId = getRequestParam(request.params.memberId);
    if (!spaceId || !memberId) {
      throw new Error("Space member path params are required");
    }
    const space = await prisma.space.findUnique({ where: { id: spaceId } });
    const existing = await prisma.spaceMember.findUnique({ where: { id: memberId } });

    if (!space || !existing || existing.spaceId !== spaceId) {
      throw new Error("Space member not found");
    }

    if (space.ownerId !== request.user!.sub) {
      return response.status(403).json({ message: "Forbidden" });
    }

    await prisma.spaceMember.delete({
      where: { id: memberId }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "space_member.remove",
      entityType: "space_member",
      entityId: existing.id,
      before: existing,
      ipAddress: getRequestIp(request)
    });

    response.status(204).send();
  })
);

spacesRouter.get(
  "/:id/invitations",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const spaceId = getRequestParam(request.params.id);

    if (!spaceId) {
      throw new Error("Space id is required");
    }

    const invitations = await prisma.spaceInvitation.findMany({
      where: {
        spaceId,
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

spacesRouter.post(
  "/:id/invitations",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const spaceId = getRequestParam(request.params.id);

    if (!spaceId) {
      throw new Error("Space id is required");
    }

    const payload = createSpaceInvitationSchema.parse(request.body);
    const space = await prisma.space.findUnique({ where: { id: spaceId } });

    if (!space) {
      throw new Error("Space not found");
    }

    if (space.ownerId !== request.user!.sub) {
      return response.status(403).json({ message: "Forbidden" });
    }

    const existingMember = await prisma.spaceMember.findFirst({
      where: { spaceId, userId: payload.invitedUserId }
    });

    if (existingMember) {
      throw new Error("User is already a space member");
    }

    const invitation = await prisma.spaceInvitation.create({
      data: {
        spaceId,
        invitedUserId: payload.invitedUserId,
        invitedByUserId: request.user!.sub,
        role: payload.role as SpaceMemberRole,
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
      action: "space_invitation.create",
      entityType: "space_invitation",
      entityId: invitation.id,
      after: invitation,
      ipAddress: getRequestIp(request)
    });

    response.status(201).json(invitation);
  })
);

spacesRouter.post(
  "/invitations/:invitationId/respond",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const invitationId = getRequestParam(request.params.invitationId);

    if (!invitationId) {
      throw new Error("Invitation id is required");
    }

    const payload = respondSpaceInvitationSchema.parse(request.body);
    const invitation = await prisma.spaceInvitation.findUnique({
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

    const updated = await prisma.spaceInvitation.update({
      where: { id: invitationId },
      data: {
        status: nextStatus,
        respondedAt: new Date()
      }
    });

    if (payload.action === "ACCEPT") {
      await prisma.spaceMember.create({
        data: {
          spaceId: invitation.spaceId,
          userId: invitation.invitedUserId,
          role: invitation.role
        }
      });
    }

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: payload.action === "ACCEPT" ? "space_invitation.accept" : "space_invitation.decline",
      entityType: "space_invitation",
      entityId: updated.id,
      before: invitation,
      after: updated,
      ipAddress: getRequestIp(request)
    });

    response.json(updated);
  })
);
