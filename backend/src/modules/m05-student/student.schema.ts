import { z } from "zod";
import { ethiopianPhoneSchema } from "../../lib/validation";

const studentStatusEnum = z.enum(["ACTIVE", "TRANSFERRED", "WITHDRAWN", "GRADUATED"]);

const secondaryGuardianFields = {
  secondaryGuardianName: z.string().min(1).optional(),
  secondaryGuardianPhone: ethiopianPhoneSchema.optional(),
};

const secondaryGuardianRefine = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((data, ctx) => {
    const d = data as {
      secondaryGuardianName?: string;
      secondaryGuardianPhone?: string;
    };
    const hasName = Boolean(d.secondaryGuardianName?.trim());
    const hasPhone = Boolean(d.secondaryGuardianPhone);
    if (hasName !== hasPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Secondary guardian requires both name and phone",
        path: hasName ? ["secondaryGuardianPhone"] : ["secondaryGuardianName"],
      });
    }
  });

const optionalStudentExtras = {
  enrollmentNumber: z.string().min(1).max(32).optional(),
  nationalId: z.string().max(64).optional().nullable(),
  bloodGroup: z.string().max(16).optional().nullable(),
  allergies: z.string().max(500).optional().nullable(),
  ...secondaryGuardianFields,
};

export const listStudentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  status: studentStatusEnum.optional(),
  medresaCourseId: z.string().uuid().optional(),
});

const studentBodySchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  dateOfBirth: z.coerce.date(),
  gender: z.enum(["MALE", "FEMALE"]),
  address: z.string().min(1, "Address is required"),
  guardianName: z.string().min(1, "Guardian name is required"),
  guardianPhone: ethiopianPhoneSchema,
  ...optionalStudentExtras,
});

export const createStudentSchema = secondaryGuardianRefine(studentBodySchema);

export const updateStudentSchema = secondaryGuardianRefine(studentBodySchema.partial());

export const assignStudentCourseSchema = z.object({
  medresaCourseId: z.string().uuid(),
});

export const transferStudentSchema = z.object({
  toMedresaId: z.string().uuid(),
  transferDate: z.coerce.date(),
  reason: z.string().max(500).optional().nullable(),
});

export const withdrawStudentSchema = z.object({
  reason: z.string().max(500).optional().nullable(),
  withdrawnAt: z.coerce.date().optional(),
});

export const graduateStudentSchema = z.object({
  graduatedAt: z.coerce.date().optional(),
});

export const reactivateStudentSchema = z.object({
  reactivatedAt: z.coerce.date().optional(),
});

export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type AssignStudentCourseInput = z.infer<typeof assignStudentCourseSchema>;
export type TransferStudentInput = z.infer<typeof transferStudentSchema>;
export type WithdrawStudentInput = z.infer<typeof withdrawStudentSchema>;
export type GraduateStudentInput = z.infer<typeof graduateStudentSchema>;
export type ReactivateStudentInput = z.infer<typeof reactivateStudentSchema>;
