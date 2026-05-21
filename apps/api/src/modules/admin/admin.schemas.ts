import { z } from "zod";

export const auditQuerySchema = z.object({
  entityType: z.string().optional(),
  action: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100)
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["USER", "ORGANIZER", "MODERATOR", "ADMIN", "SUPER_ADMIN", "FINANCE"])
});
