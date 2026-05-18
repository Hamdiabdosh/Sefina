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

export const createUserSchema = z
  .object({
    fullName: z.string().min(2, 'Full name is required'),
    phone: z.string().regex(ethiopianPhoneRegex, 'Use Ethiopian format 09XXXXXXXX or +2519XXXXXXXX'),
    email: z.string().email('Invalid email'),
    setTemporaryPassword: z.boolean(),
    temporaryPassword: z.string().optional(),
    confirmTemporaryPassword: z.string().optional(),
    sendInviteEmail: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.setTemporaryPassword) return;

    if (!data.temporaryPassword || data.temporaryPassword.length < 8) {
      ctx.addIssue({
        code: 'custom',
        path: ['temporaryPassword'],
        message: 'Password must be at least 8 characters',
      });
    }

    if (data.temporaryPassword !== data.confirmTemporaryPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmTemporaryPassword'],
        message: 'Passwords do not match',
      });
    }
  });

export const editUserSchema = z
  .object({
    fullName: z.string().min(2, 'Full name is required').optional(),
    phone: z
      .string()
      .regex(ethiopianPhoneRegex, 'Use Ethiopian format 09XXXXXXXX or +2519XXXXXXXX')
      .optional(),
    email: z.string().email('Invalid email').optional(),
    setTemporaryPassword: z.boolean(),
    temporaryPassword: z.string().optional(),
    confirmTemporaryPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.setTemporaryPassword) return;

    if (!data.temporaryPassword || data.temporaryPassword.length < 8) {
      ctx.addIssue({
        code: 'custom',
        path: ['temporaryPassword'],
        message: 'Password must be at least 8 characters',
      });
    }

    if (data.temporaryPassword !== data.confirmTemporaryPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmTemporaryPassword'],
        message: 'Passwords do not match',
      });
    }
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type EditUserFormValues = z.infer<typeof editUserSchema>;

export type CreateUserApiPayload = {
  fullName: string;
  phone: string;
  email: string;
  temporaryPassword?: string;
  sendInviteEmail?: boolean;
};

export type UpdateUserApiPayload = {
  fullName?: string;
  phone?: string;
  email?: string;
  temporaryPassword?: string;
};

export const toCreateUserPayload = (data: CreateUserFormValues): CreateUserApiPayload => {
  const payload: CreateUserApiPayload = {
    fullName: data.fullName,
    phone: data.phone,
    email: data.email,
  };

  if (data.setTemporaryPassword && data.temporaryPassword) {
    payload.temporaryPassword = data.temporaryPassword;
    if (data.sendInviteEmail) {
      payload.sendInviteEmail = true;
    }
  }

  return payload;
};

export const toUpdateUserPayload = (data: EditUserFormValues): UpdateUserApiPayload => {
  const payload: UpdateUserApiPayload = {};

  if (data.fullName !== undefined) payload.fullName = data.fullName;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.email !== undefined) payload.email = data.email;

  if (data.setTemporaryPassword && data.temporaryPassword) {
    payload.temporaryPassword = data.temporaryPassword;
  }

  return payload;
};
