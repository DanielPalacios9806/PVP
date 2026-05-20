import { z } from "zod";

export const addSpaceMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "MODERATOR", "MEMBER"]).default("MEMBER")
});
