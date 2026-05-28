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
  email: z.string().trim().toLowerCase().email("Ingresa un correo valido."),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "El usuario debe tener al menos 3 caracteres.")
    .max(24, "El usuario no debe superar 24 caracteres.")
    .regex(/^[a-zA-Z0-9._-]+$/, "El usuario solo puede usar letras, numeros, punto, guion o guion bajo."),
  displayName: z.string().trim().min(2, "El nombre visible debe tener al menos 2 caracteres.").max(50, "El nombre visible no debe superar 50 caracteres."),
  role: z.enum(["USER", "ORGANIZER", "MODERATOR", "ADMIN", "FINANCE"]),
  status: userStatusSchema.default("ACTIVE")
});

export const updateUserStatusSchema = z.object({
  status: userStatusSchema
});
