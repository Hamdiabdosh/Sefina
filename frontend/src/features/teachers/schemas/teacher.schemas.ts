import { z } from 'zod';

const phoneSchema = z
  .string()
  .regex(/^(?:\+2519|09)\d{8}$/, 'Phone must be Ethiopian format (09XXXXXXXX or +2519XXXXXXXX)');

export const specializationFormSchema = z.object({
  en: z.string().min(1, 'English specialization is required'),
  am: z.string().optional(),
  ar: z.string().optional(),
});

export const teacherFormSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: phoneSchema,
  email: z.string().email('Invalid email'),
  specializationEn: z.string().min(1, 'Specialization is required'),
  specializationAm: z.string().optional(),
  specializationAr: z.string().optional(),
  dateJoined: z.string().min(1, 'Date joined is required'),
});

export const createTeacherFormSchema = teacherFormSchema
  .extend({
    assignToMedresa: z.boolean(),
    medresaId: z.string().optional(),
    assignmentRole: z.enum(['TEACHER', 'ADMIN']),
    assignmentDate: z.string().optional(),
    setTemporaryPassword: z.boolean(),
    temporaryPassword: z.string().optional(),
    confirmTemporaryPassword: z.string().optional(),
    sendInviteEmail: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.assignToMedresa && !data.medresaId) {
      ctx.addIssue({
        code: 'custom',
        path: ['medresaId'],
        message: 'Select a medresa',
      });
    }

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

export type TeacherFormValues = z.infer<typeof teacherFormSchema>;
export type CreateTeacherFormValues = z.infer<typeof createTeacherFormSchema>;

export type TeacherApiPayload = {
  fullName: string;
  phone: string;
  email: string;
  specialization: { en: string; am?: string; ar?: string };
  dateJoined: string;
  initialAssignment?: {
    medresaId: string;
    role: 'TEACHER' | 'ADMIN';
    assignedSince?: string;
  };
  temporaryPassword?: string;
  sendInviteEmail?: boolean;
};

export const toTeacherApiPayload = (data: CreateTeacherFormValues): TeacherApiPayload => {
  const payload: TeacherApiPayload = {
    fullName: data.fullName.trim(),
    phone: data.phone.trim(),
    email: data.email.trim(),
    specialization: {
      en: data.specializationEn.trim(),
      ...(data.specializationAm?.trim() ? { am: data.specializationAm.trim() } : {}),
      ...(data.specializationAr?.trim() ? { ar: data.specializationAr.trim() } : {}),
    },
    dateJoined: new Date(data.dateJoined).toISOString(),
  };

  if (data.assignToMedresa && data.medresaId) {
    payload.initialAssignment = {
      medresaId: data.medresaId,
      role: data.assignmentRole,
      assignedSince: data.assignmentDate
        ? new Date(data.assignmentDate).toISOString()
        : undefined,
    };
  }

  if (data.setTemporaryPassword && data.temporaryPassword) {
    payload.temporaryPassword = data.temporaryPassword;
    if (data.sendInviteEmail) {
      payload.sendInviteEmail = true;
    }
  }

  return payload;
};

/** @deprecated Use CreateTeacherFormValues for create flow */
export const toTeacherApiPayloadFromBasic = (data: TeacherFormValues): TeacherApiPayload =>
  toTeacherApiPayload({
    ...data,
    assignToMedresa: false,
    assignmentRole: 'TEACHER',
    setTemporaryPassword: false,
    sendInviteEmail: false,
  });

export const getTeacherMutationError = (error: unknown): string | null => {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response
  ) {
    const data = error.response.data as { error?: { code?: string; message?: string } };
    if (data.error?.code === 'TEACHER_PHONE_EXISTS') {
      return 'A teacher with this phone number already exists.';
    }
    if (data.error?.code === 'TEACHER_EMAIL_EXISTS') {
      return 'A teacher with this email already exists.';
    }
    if (data.error?.code === 'MEDRESA_INACTIVE') {
      return 'Selected medresa is inactive or not found.';
    }
    if (data.error?.message) {
      return data.error.message;
    }
  }
  return null;
};
