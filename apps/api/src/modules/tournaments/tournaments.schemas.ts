import { z } from "zod";

export const tournamentSchema = z.object({
  spaceId: z.string().optional(),
  name: z.string().min(3).max(120),
  slug: z.string().min(3).max(120).optional(),
  game: z.string().min(2).max(50),
  platformRoute: z.string().min(2).max(20).optional(),
  regionalRoute: z.string().min(2).max(30).optional(),
  teamSize: z.number().int().positive().max(10).optional(),
  format: z.enum(["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "ROUND_ROBIN"]),
  type: z.enum(["SOLO", "TEAM"]),
  rules: z.string().max(5000).optional(),
  publicRules: z.string().max(10000).optional(),
  prizes: z.string().max(5000).optional(),
  entryFeeTokens: z.number().int().min(0).default(0),
  maxParticipants: z.number().int().positive(),
  minParticipants: z.number().int().positive().default(20),
  checkInEnabled: z.boolean().default(false),
  registrationClosesAt: z.string().datetime().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  status: z
    .enum([
      "DRAFT",
      "PUBLISHED",
      "REGISTRATION_OPEN",
      "REGISTRATION_CLOSED",
      "CHECK_IN",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED"
    ])
    .optional()
});

export const registrationSchema = z.object({
  userId: z.string().optional(),
  teamId: z.string().optional()
});

export const checkInSchema = z.object({
  registrationId: z.string().min(1)
});

export const matchSchema = z.object({
  roundId: z.string().optional(),
  homeRegistrationId: z.string().optional(),
  awayRegistrationId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  bestOf: z.number().int().positive().default(1),
  status: z
    .enum(["PENDING", "READY", "IN_PROGRESS", "RESULT_PENDING", "COMPLETED", "DISPUTED", "CANCELLED"])
    .optional()
});
