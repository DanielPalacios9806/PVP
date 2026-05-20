import { z } from "zod";

export const createSpaceInvitationSchema = z.object({
  invitedUserId: z.string().min(1),
  role: z.enum(["ADMIN", "MODERATOR", "MEMBER"]).default("MEMBER")
});

export const respondSpaceInvitationSchema = z.object({
  action: z.enum(["ACCEPT", "DECLINE"])
});
