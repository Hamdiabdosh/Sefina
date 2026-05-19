import { z } from 'zod';

const ethiopianPhoneRegex = /^(?:\+2519|09)\d{8}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const identifierSchema = z
  .string()
  .min(3)
  .refine((value) => emailRegex.test(value) || ethiopianPhoneRegex.test(value), {
    message: 'Enter a valid email or Ethiopian phone (09XXXXXXXX)',
  });

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const forgotPasswordSchema = z.object({
  identifier: identifierSchema,
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const setStaffPasswordSchema = z
  .object({
    temporaryPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmTemporaryPassword: z.string().min(8),
  })
  .refine((data) => data.temporaryPassword === data.confirmTemporaryPassword, {
    message: 'Passwords do not match',
    path: ['confirmTemporaryPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type SetStaffPasswordFormValues = z.infer<typeof setStaffPasswordSchema>;
