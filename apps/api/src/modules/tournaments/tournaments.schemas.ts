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

export const externalBridgeSchema = z.object({
  externalProvider: z.enum(["TOORNAMENT_MANUAL", "TOORNAMENT_API"]).nullable().optional(),
  externalTournamentId: z.string().trim().max(160).nullable().optional(),
  externalBracketUrl: z.string().trim().url().max(500).nullable().optional()
});

export const toornamentManualImportSchema = z.object({
  dryRun: z.boolean().default(false),
  externalTournamentId: z.string().trim().max(160).optional(),
  externalBracketUrl: z.string().trim().url().max(500).optional(),
  participants: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(160),
        email: z.string().trim().email().optional(),
        teamName: z.string().trim().max(160).optional(),
        teamTag: z.string().trim().max(20).optional(),
        externalParticipantId: z.string().trim().max(160).optional()
      })
    )
    .max(256)
    .default([]),
  matches: z
    .array(
      z.object({
        roundName: z.string().trim().min(1).max(80).default("Ronda 1"),
        sequence: z.number().int().positive().optional(),
        externalMatchId: z.string().trim().max(160).optional(),
        externalBracketUrl: z.string().trim().url().max(500).optional(),
        home: z.string().trim().min(1).max(160),
        away: z.string().trim().max(160).optional(),
        scheduledAt: z.string().datetime().optional(),
        bestOf: z.number().int().positive().max(7).default(1),
        lobbyCode: z.string().trim().max(140).optional(),
        lobbyName: z.string().trim().max(160).optional(),
        lobbyPassword: z.string().trim().max(80).optional(),
        instructions: z.string().trim().max(1200).optional(),
        status: z.enum(["PENDING", "READY", "IN_PROGRESS"]).default("READY")
      })
    )
    .max(512)
    .default([])
}).refine((payload) => payload.participants.length > 0 || payload.matches.length > 0, {
  message: "Import requires participants or matches"
});
