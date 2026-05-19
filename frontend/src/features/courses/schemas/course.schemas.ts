import { z } from 'zod';

export const courseFormSchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAm: z.string().optional(),
  nameAr: z.string().optional(),
  descriptionEn: z.string().min(1, 'English description is required'),
  descriptionAm: z.string().optional(),
  descriptionAr: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;

export const toCourseApiPayload = (data: CourseFormValues) => ({
  name: {
    en: data.nameEn.trim(),
    ...(data.nameAm?.trim() ? { am: data.nameAm.trim() } : {}),
    ...(data.nameAr?.trim() ? { ar: data.nameAr.trim() } : {}),
  },
  description: {
    en: data.descriptionEn.trim(),
    ...(data.descriptionAm?.trim() ? { am: data.descriptionAm.trim() } : {}),
    ...(data.descriptionAr?.trim() ? { ar: data.descriptionAr.trim() } : {}),
  },
  level: data.level,
  ...(data.status ? { status: data.status } : {}),
});

export const courseFormFromApi = (course: {
  name: { en: string; am?: string; ar?: string };
  description: { en: string; am?: string; ar?: string };
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  status?: 'ACTIVE' | 'INACTIVE';
}): CourseFormValues => ({
  nameEn: course.name.en,
  nameAm: course.name.am ?? '',
  nameAr: course.name.ar ?? '',
  descriptionEn: course.description.en,
  descriptionAm: course.description.am ?? '',
  descriptionAr: course.description.ar ?? '',
  level: course.level,
  status: course.status ?? 'ACTIVE',
});

export const getCourseMutationError = (error: unknown): string => {
  const err = error as { response?: { data?: { error?: { code?: string } } } };
  const code = err.response?.data?.error?.code;
  if (code === 'DUPLICATE_COURSE_NAME') return 'A course with this English name already exists.';
  return 'Something went wrong. Please try again.';
};
