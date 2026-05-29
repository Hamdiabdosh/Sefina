import { z } from "zod";
import { localizedStringSchema } from "../../lib/localized-string.schema";

export { localizedStringSchema };

export const listCoursesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const createCourseSchema = z.object({
  name: localizedStringSchema,
  description: localizedStringSchema,
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const updateCourseSchema = z.object({
  name: localizedStringSchema.optional(),
  description: localizedStringSchema.optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const activateMedresaCourseSchema = z.object({
  courseId: z.string().uuid(),
});

export const assignTeacherToCourseSchema = z.object({
  teacherId: z.string().uuid(),
});

export const listMedresaCoursesQuerySchema = z.object({
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  teacherId: z.string().uuid().optional(),
});

export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type ActivateMedresaCourseInput = z.infer<typeof activateMedresaCourseSchema>;
export type AssignTeacherToCourseInput = z.infer<typeof assignTeacherToCourseSchema>;
export type ListMedresaCoursesQuery = z.infer<typeof listMedresaCoursesQuerySchema>;
