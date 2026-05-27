import { z } from "zod";

export const userRoleSchema = z.enum(["USER", "ORGANIZER", "MODERATOR", "ADMIN", "SUPER_ADMIN", "FINANCE"]);
export const userStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "PENDING"]);

export const auditQuerySchema = z.object({
  entityType: z.string().optional(),
  action: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100)
});

export const updateUserRoleSchema = z.object({
  role: userRoleSchema
});

export const adminUsersQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50)
});

export const createAdminUserSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9._-]+$/, "Username contains invalid characters"),
  displayName: z.string().min(2).max(50),
  role: z.enum(["USER", "ORGANIZER", "MODERATOR", "ADMIN", "FINANCE"]),
  status: userStatusSchema.default("ACTIVE")
});

export const updateUserStatusSchema = z.object({
  status: userStatusSchema
});
