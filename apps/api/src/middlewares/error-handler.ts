import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  if (error instanceof ZodError) {
    const issues = error.flatten();
    const firstFieldError = Object.values(issues.fieldErrors).flat().find(Boolean);

    return response.status(400).json({
      message: firstFieldError ?? "Revisa los datos ingresados.",
      issues
    });
  }

  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({
      message: error.message
    });
  }

  if (error instanceof Error) {
    console.error(error);

    if (env.NODE_ENV === "production") {
      return response.status(500).json({
        message: "Unexpected server error"
      });
    }

    return response.status(400).json({ message: error.message });
  }

  return response.status(500).json({
    message: "Unexpected server error"
  });
}
