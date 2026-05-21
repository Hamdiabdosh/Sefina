import type { Response } from "express";
import { Prisma } from "../../prisma/generated/prisma/client";
import { ZodError } from "zod";
import { env } from "../config/env";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

type ErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

const errorResponse = (payload: ErrorPayload) => {
  const error: ErrorPayload = { code: payload.code, message: payload.message };
  if (payload.details !== undefined) {
    error.details = payload.details;
  }
  return { success: false as const, error };
};

export const handleControllerError = (err: unknown, res: Response): void => {
  if (res.headersSent) {
    console.error("[ERROR] after headers sent:", err);
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json(
      errorResponse({
        code: err.code,
        message: err.message,
        details: err.details,
      })
    );
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json(
      errorResponse({
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: err.flatten(),
      })
    );
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json(
        errorResponse({
          code: "CONFLICT",
          message: "A record with this value already exists",
        })
      );
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json(
        errorResponse({
          code: "NOT_FOUND",
          message: "Record not found",
        })
      );
      return;
    }
  }

  console.error("[ERROR]", err instanceof Error ? (err.stack ?? err.message) : err);

  const message =
    env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : err instanceof Error
        ? err.message
        : "An unexpected error occurred";

  res.status(500).json(
    errorResponse({
      code: "INTERNAL_ERROR",
      message,
    })
  );
};
