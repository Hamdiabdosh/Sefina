import { z } from "zod";
import { ethiopianPhoneSchema } from "../../lib/validation";

export const listStudentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  status: z.enum(["ACTIVE", "TRANSFERRED"]).optional(),
  medresaCourseId: z.string().uuid().optional(),
});

export const createStudentSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  dateOfBirth: z.coerce.date(),
  gender: z.enum(["MALE", "FEMALE"]),
  address: z.string().min(1, "Address is required"),
  guardianName: z.string().min(1, "Guardian name is required"),
  guardianPhone: ethiopianPhoneSchema,
});

export const updateStudentSchema = createStudentSchema.partial();

export const assignStudentCourseSchema = z.object({
  medresaCourseId: z.string().uuid(),
});

export const transferStudentSchema = z.object({
  toMedresaId: z.string().uuid(),
  transferDate: z.coerce.date(),
  reason: z.string().max(500).optional().nullable(),
});

export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type AssignStudentCourseInput = z.infer<typeof assignStudentCourseSchema>;
export type TransferStudentInput = z.infer<typeof transferStudentSchema>;
