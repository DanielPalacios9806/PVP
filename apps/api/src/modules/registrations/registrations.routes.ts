import { Router } from "express";
import { RegistrationStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import type { AuthenticatedRequest } from "../../types.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { getRequestIp } from "../../utils/request-ip.js";
import { getRequestParam } from "../../utils/request-param.js";
import { badRequest, forbidden, notFound } from "../../utils/http-error.js";
import { createAuditLog } from "../audit/audit.service.js";
import { registrationDecisionSchema } from "./registrations.schemas.js";

export const registrationsRouter = Router();

registrationsRouter.patch(
  "/:id/approve",
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN", "ORGANIZER"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const registrationId = getRequestParam(request.params.id);
    if (!registrationId) {
      throw badRequest("Registration id is required");
    }

    const registration = await prisma.tournamentRegistration.findUnique({
      where: { id: registrationId },
      include: {
        tournament: { select: { organizerId: true } }
      }
    });

    if (!registration) {
      throw notFound("Registration not found");
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(request.user!.role) && registration.tournament.organizerId !== request.user!.sub) {
      throw forbidden("Forbidden");
    }

    if (registration.status !== RegistrationStatus.PENDING) {
      throw badRequest("Only pending registrations can be approved");
    }

    const updated = await prisma.tournamentRegistration.update({
      where: { id: registration.id },
      data: {
        status: RegistrationStatus.CONFIRMED,
        approvedByUserId: request.user!.sub,
        approvedAt: new Date(),
        rejectedReason: null
      }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "registration.approve",
      entityType: "tournament_registration",
      entityId: updated.id,
      before: registration,
      after: updated,
      ipAddress: getRequestIp(request)
    });

    response.json(updated);
  })
);
registrationsRouter.patch(
  "/:id/reject",
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN", "ORGANIZER"]),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const registrationId = getRequestParam(request.params.id);
    if (!registrationId) {
      throw badRequest("Registration id is required");
    }

    const payload = registrationDecisionSchema.parse(request.body);

    const registration = await prisma.tournamentRegistration.findUnique({
      where: { id: registrationId },
      include: {
        tournament: { select: { organizerId: true } }
      }
    });

    if (!registration) {
      throw notFound("Registration not found");
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(request.user!.role) && registration.tournament.organizerId !== request.user!.sub) {
      throw forbidden("Forbidden");
    }

    if (registration.status !== RegistrationStatus.PENDING) {
      throw badRequest("Only pending registrations can be rejected");
    }

    const updated = await prisma.tournamentRegistration.update({
      where: { id: registration.id },
      data: {
        status: RegistrationStatus.REJECTED,
        approvedByUserId: request.user!.sub,
        approvedAt: new Date(),
        rejectedReason: payload.reason ?? "Rejected by organizer"
      }
    });

    await createAuditLog({
      actorUserId: request.user!.sub,
      action: "registration.reject",
      entityType: "tournament_registration",
      entityId: updated.id,
      before: registration,
      after: updated,
      ipAddress: getRequestIp(request)
    });

    response.json(updated);
  })
);
