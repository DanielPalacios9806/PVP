import { z } from "zod";

export const teamSchema = z.object({
  name: z.string().min(2).max(60),
  slug: z.string().min(2).max(60).optional(),
  tag: z.string().max(10).optional(),
  description: z.string().max(300).optional()
});
