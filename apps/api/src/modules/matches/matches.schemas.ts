import { z } from "zod";

export const reportResultSchema = z.object({
  winnerRegistrationId: z.string().optional(),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  evidenceUrls: z.array(z.string().url()).default([]),
  notes: z.string().max(1000).optional()
});

export const confirmResultSchema = z.object({
  approved: z.boolean()
});



export const updateManualLobbySchema = z.object({
  scheduledAt: z.string().max(80).optional(),
  lobbyName: z.string().max(160).optional(),
  lobbyPassword: z.string().max(80).optional(),
  lobbyCode: z.string().max(140).optional(),
  externalProvider: z.enum(["TOORNAMENT_MANUAL", "TOORNAMENT_API"]).nullable().optional(),
  externalMatchId: z.string().max(160).nullable().optional(),
  externalBracketUrl: z.string().url().max(500).nullable().optional(),
  instructions: z.string().max(1200).optional(),
  status: z.enum(["PENDING", "READY", "IN_PROGRESS"]).optional()
});

export const moderatorConfirmResultSchema = z.object({
  winnerRegistrationId: z.string().min(1),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  evidenceUrls: z.array(z.string().url()).default([]),
  notes: z.string().max(1000).optional(),
  confirmationSource: z.enum(["WINNER_EVIDENCE", "TOORNAMENT_MANUAL", "EXTERNAL_BRACKET", "MODERATOR_DECISION"]),
  moderationNote: z.string().max(1200).optional()
});

export const createDisputeSchema = z.object({
  reason: z.string().min(10).max(1000)
});

export const resolveDisputeSchema = z.object({
  resolution: z.string().min(10).max(1000),
  approvedResultId: z.string().optional(),
  approved: z.boolean().optional()
});
