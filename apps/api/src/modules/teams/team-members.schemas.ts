import { z } from "zod";

export const addTeamMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["CAPTAIN", "MEMBER", "SUBSTITUTE"]).default("MEMBER")
});
