import { z } from "zod";
import { localizedStringSchema } from "../m04-course/course.schema";

export const listExamTypesQuerySchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const createExamTypeSchema = z.object({
  name: localizedStringSchema,
  maxScore: z.coerce.number().int().positive().max(1000),
  weight: z.coerce.number().int().min(1).max(100),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const updateExamTypeSchema = z.object({
  name: localizedStringSchema.optional(),
  maxScore: z.coerce.number().int().positive().max(1000).optional(),
  weight: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const createGradeSchema = z.object({
  studentId: z.uuid(),
  medresaCourseId: z.uuid(),
  examTypeId: z.uuid(),
  numericScore: z.coerce.number().int().min(0),
});

export const batchGradesSchema = z.object({
  medresaCourseId: z.uuid(),
  examTypeId: z.uuid(),
  grades: z
    .array(
      z.object({
        studentId: z.uuid(),
        numericScore: z.coerce.number().int().min(0),
      })
    )
    .min(1),
});

export const createGradeEditRequestSchema = z.object({
  requestedScore: z.coerce.number().int().min(0),
  reason: z.string().min(1).max(500),
});

export const rejectGradeEditRequestSchema = z.object({
  rejectionReason: z.string().min(1).max(500),
});

export const listGradeEditRequestsQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  medresaId: z.uuid().optional(),
});

export type ListExamTypesQuery = z.infer<typeof listExamTypesQuerySchema>;
export type CreateExamTypeInput = z.infer<typeof createExamTypeSchema>;
export type UpdateExamTypeInput = z.infer<typeof updateExamTypeSchema>;
export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type BatchGradesInput = z.infer<typeof batchGradesSchema>;
export type CreateGradeEditRequestInput = z.infer<typeof createGradeEditRequestSchema>;
export type RejectGradeEditRequestInput = z.infer<typeof rejectGradeEditRequestSchema>;
export type ListGradeEditRequestsQuery = z.infer<typeof listGradeEditRequestsQuerySchema>;
