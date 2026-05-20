import { z } from "zod";

export const disputeSchema = z.object({
  reason: z.string().min(5).max(1000)
});

export const resolveDisputeSchema = z.object({
  resolution: z.string().min(5).max(1000),
  status: z.enum(["RESOLVED", "REJECTED"]).default("RESOLVED")
});
