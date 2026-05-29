import { z } from "zod";

export const userRoleSchema = z.enum(["USER", "ORGANIZER", "MODERATOR", "ADMIN", "SUPER_ADMIN", "FINANCE"]);
export const userStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "PENDING"]);
export const walletTransactionTypeSchema = z.enum(["ADMIN_ADJUSTMENT", "TOURNAMENT_REWARD", "CORRECTION"]);

export const auditModuleSchema = z.enum(["auth", "admin", "tokens", "tournaments", "matches", "riot", "teams", "spaces", "system"]);

export const auditQuerySchema = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  module: auditModuleSchema.optional(),
  entityType: z.string().trim().min(1).max(80).optional(),
  action: z.string().trim().min(1).max(120).optional(),
  actorUserId: z.string().cuid().optional(),
  criticalOnly: z.coerce.boolean().default(false),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100)
});


export const userActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const tokenTransactionQuerySchema = z.object({
  userId: z.string().cuid().optional(),
  type: walletTransactionTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50)
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


export const adjustUserTokensSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Ingresa una cantidad valida de tokens." })
    .int("El ajuste debe ser un numero entero.")
    .min(-10000, "El ajuste minimo permitido es -10000 tokens.")
    .max(10000, "El ajuste maximo permitido es 10000 tokens.")
    .refine((value) => value !== 0, "El ajuste no puede ser cero."),
  reason: z
    .string()
    .trim()
    .min(8, "Escribe una justificacion de al menos 8 caracteres.")
    .max(240, "La justificacion no debe superar 240 caracteres.")
});
