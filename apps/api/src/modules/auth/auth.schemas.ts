import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string({ required_error: "Ingresa tu correo." })
    .trim()
    .email("Ingresa un correo valido."),
  username: z
    .string({ required_error: "Ingresa un usuario." })
    .trim()
    .min(3, "El usuario debe tener al menos 3 caracteres.")
    .max(24, "El usuario no debe superar 24 caracteres.")
    .regex(/^[a-zA-Z0-9._-]+$/, "El usuario solo puede usar letras, numeros, punto, guion o guion bajo."),
  displayName: z
    .string({ required_error: "Ingresa un nombre visible." })
    .trim()
    .min(2, "El nombre visible debe tener al menos 2 caracteres.")
    .max(50, "El nombre visible no debe superar 50 caracteres."),
  password: z
    .string({ required_error: "Ingresa una contrasena." })
    .min(8, "La contrasena debe tener al menos 8 caracteres.")
    .max(64, "La contrasena no debe superar 64 caracteres.")
    .regex(/[a-z]/, "La contrasena debe incluir una letra minuscula.")
    .regex(/[A-Z]/, "La contrasena debe incluir una letra mayuscula.")
    .regex(/[0-9]/, "La contrasena debe incluir un numero.")
    .regex(/[^A-Za-z0-9]/, "La contrasena debe incluir un caracter especial.")
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Ingresa tu correo." })
    .trim()
    .email("Ingresa un correo valido."),
  password: z
    .string({ required_error: "Ingresa tu contrasena." })
    .min(8, "La contrasena debe tener al menos 8 caracteres.")
    .max(64, "La contrasena no debe superar 64 caracteres.")
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(64),
  newPassword: z
    .string()
    .min(8, "La nueva contrasena debe tener al menos 8 caracteres.")
    .max(64, "La nueva contrasena no debe superar 64 caracteres.")
    .regex(/[a-z]/, "La nueva contrasena debe incluir una letra minuscula.")
    .regex(/[A-Z]/, "La nueva contrasena debe incluir una letra mayuscula.")
    .regex(/[0-9]/, "La nueva contrasena debe incluir un numero.")
    .regex(/[^A-Za-z0-9]/, "La nueva contrasena debe incluir un caracter especial.")
});
