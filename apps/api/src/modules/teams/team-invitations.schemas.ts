import { z } from "zod";

export const createTeamInvitationSchema = z.object({
  invitedUserId: z.string().min(1),
  role: z.enum(["CAPTAIN", "MEMBER", "SUBSTITUTE"]).default("MEMBER")
});

export const respondTeamInvitationSchema = z.object({
  action: z.enum(["ACCEPT", "DECLINE"])
});
