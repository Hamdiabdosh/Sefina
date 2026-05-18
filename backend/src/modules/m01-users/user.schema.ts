import { z } from "zod";
import { emailSchema, ethiopianPhoneSchema } from "../../lib/validation";

export const listUsersQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  medresaId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

export const createUserSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: ethiopianPhoneSchema,
  email: emailSchema,
  temporaryPassword: passwordSchema.optional(),
  sendInviteEmail: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: ethiopianPhoneSchema.optional(),
  email: emailSchema.optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  temporaryPassword: passwordSchema.optional(),
});

export const setUserPasswordSchema = z.object({
  temporaryPassword: passwordSchema,
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SetUserPasswordInput = z.infer<typeof setUserPasswordSchema>;
