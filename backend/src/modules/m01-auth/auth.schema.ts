import { z } from "zod";
import { identifierSchema } from "../../lib/validation";

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(8, "password must be at least 8 characters"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10).optional(),
});

export const passwordResetRequestSchema = z.object({
  identifier: identifierSchema,
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(10, "token is required"),
  newPassword: z.string().min(8, "newPassword must be at least 8 characters"),
});
