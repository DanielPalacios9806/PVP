import { z } from "zod";

export const registrationDecisionSchema = z.object({
  reason: z.string().max(500).optional()
});
