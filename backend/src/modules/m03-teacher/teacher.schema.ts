import { z } from "zod";
import { emailSchema, ethiopianPhoneSchema } from "../../lib/validation";

export const specializationSchema = z.object({
  en: z.string().min(1, "English specialization is required"),
  am: z.string().optional(),
  ar: z.string().optional(),
});

export const listTeachersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  medresaId: z.string().uuid().optional(),
  specialization: z.string().optional(),
});

const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

export const initialAssignmentSchema = z.object({
  medresaId: z.string().uuid(),
  role: z.enum(["TEACHER", "ADMIN"]),
  assignedSince: z.coerce.date().optional(),
});

export const createTeacherSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: ethiopianPhoneSchema,
  email: emailSchema,
  specialization: specializationSchema,
  dateJoined: z.coerce.date(),
  cbeAccount: z.string().max(20).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  initialAssignment: initialAssignmentSchema.optional(),
  temporaryPassword: passwordSchema.optional(),
  sendInviteEmail: z.boolean().optional(),
});

export const updateTeacherSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: ethiopianPhoneSchema.optional(),
  email: emailSchema.optional(),
  specialization: specializationSchema.optional(),
  dateJoined: z.coerce.date().optional(),
  cbeAccount: z.string().max(20).optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const assignMedresaSchema = z.object({
  medresaId: z.string().uuid(),
  role: z.enum(["TEACHER", "ADMIN"]),
  assignedSince: z.coerce.date().optional(),
});

export const bulkAssignMedresaSchema = z.object({
  assignments: z.array(assignMedresaSchema).min(1),
});

export const updateAssignmentRoleSchema = z.object({
  role: z.enum(["TEACHER", "ADMIN"]),
});

export type ListTeachersQuery = z.infer<typeof listTeachersQuerySchema>;
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
export type AssignMedresaInput = z.infer<typeof assignMedresaSchema>;
export type BulkAssignMedresaInput = z.infer<typeof bulkAssignMedresaSchema>;
export type UpdateAssignmentRoleInput = z.infer<typeof updateAssignmentRoleSchema>;
