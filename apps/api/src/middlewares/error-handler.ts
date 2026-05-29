import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

type ErrorLike = {
  code?: unknown;
  message?: unknown;
  name?: unknown;
  status?: unknown;
  statusCode?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asErrorLike(error: unknown): ErrorLike {
  return isRecord(error) ? error : {};
}

function resolveStatusCode(error: unknown) {
  const errorLike = asErrorLike(error);
  const status = typeof errorLike.status === "number" ? errorLike.status : undefined;
  const statusCode = typeof errorLike.statusCode === "number" ? errorLike.statusCode : undefined;
  const candidate = statusCode ?? status;

  if (candidate && candidate >= 400 && candidate <= 599) {
    return candidate;
  }

  return 500;
}

function getPrismaErrorResponse(code: string) {
  if (code === "P2002") {
    return { statusCode: 409, message: "Ya existe un registro con esos datos." };
  }

  if (code === "P2025") {
    return { statusCode: 404, message: "No se encontró el registro solicitado." };
  }

  if (code === "P1001") {
    return { statusCode: 503, message: "No se pudo conectar con la base de datos." };
  }

  if (code.startsWith("P2")) {
    return { statusCode: 400, message: "No se pudo procesar la operación solicitada." };
  }

  return null;
}

function logServerError(error: unknown, request: Request) {
  console.error("Unhandled API error", {
    method: request.method,
    path: request.originalUrl,
    error
  });
}

export function errorHandler(
  error: unknown,
  request: Request,
  response: Response,
  _next: NextFunction
) {
  if (error instanceof ZodError) {
    const issues = error.flatten();
    const firstFieldError = Object.values(issues.fieldErrors).flat().find(Boolean);

    return response.status(400).json({
      message: firstFieldError ?? "Revisa los datos ingresados.",
      ...(env.NODE_ENV === "production" ? {} : { issues })
    });
  }

  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({
      message: error.message
    });
  }

  const errorLike = asErrorLike(error);
  const code = typeof errorLike.code === "string" ? errorLike.code : undefined;
  const prismaError = code ? getPrismaErrorResponse(code) : null;

  if (prismaError) {
    if (prismaError.statusCode >= 500) {
      logServerError(error, request);
    }

    return response.status(prismaError.statusCode).json({
      message: prismaError.message
    });
  }

  if (error instanceof SyntaxError && "body" in error) {
    return response.status(400).json({
      message: "El cuerpo de la solicitud no tiene un formato JSON válido."
    });
  }

  if (error instanceof Error) {
    const statusCode = resolveStatusCode(error);

    if (statusCode >= 500) {
      logServerError(error, request);
    }

    if (env.NODE_ENV === "production" && statusCode >= 500) {
      return response.status(statusCode).json({
        message: "Error interno del servidor. Intenta nuevamente más tarde."
      });
    }

    return response.status(statusCode).json({
      message: error.message
    });
  }

  logServerError(error, request);
  return response.status(500).json({
    message: "Error interno del servidor. Intenta nuevamente más tarde."
  });
}
