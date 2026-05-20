import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9._-]+$/, "Username contains invalid characters"),
  displayName: z.string().min(2).max(50),
  password: z
    .string()
    .min(8)
    .max(64)
    .regex(/[a-z]/, "Password must include one lowercase letter")
    .regex(/[A-Z]/, "Password must include one uppercase letter")
    .regex(/[0-9]/, "Password must include one number")
    .regex(/[^A-Za-z0-9]/, "Password must include one special character")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(64)
});
