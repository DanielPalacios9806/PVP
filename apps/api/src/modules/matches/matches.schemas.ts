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


export const createDisputeSchema = z.object({
  reason: z.string().min(10).max(1000)
});

export const resolveDisputeSchema = z.object({
  resolution: z.string().min(10).max(1000),
  approvedResultId: z.string().optional(),
  approved: z.boolean().optional()
});
