import type { Prisma } from "../../prisma/generated/prisma/client";

const localizedCourseNameOr = (term: string): Prisma.CourseWhereInput[] =>
  (["en", "am", "ar"] as const).map((lang) => ({
    name: { path: [lang], string_contains: term, mode: "insensitive" },
  }));

/** Build OR conditions for free-text student search (name, guardian, phone, address, course names). */
export const buildStudentSearchOr = (search: string): Prisma.StudentWhereInput[] => {
  const term = search.trim();
  if (!term) return [];

  return [
    { full_name: { contains: term, mode: "insensitive" } },
    { guardian_name: { contains: term, mode: "insensitive" } },
    { guardian_phone: { contains: term } },
    { address: { contains: term, mode: "insensitive" } },
    { enrollment_number: { contains: term, mode: "insensitive" } } as Prisma.StudentWhereInput,
    {
      student_courses: {
        some: {
          deleted_at: null,
          medresa_course: {
            deleted_at: null,
            course: { OR: localizedCourseNameOr(term) },
          },
        },
      },
    },
  ];
};

export const studentListWhere = (
  medresaId: string,
  filters: {
    gender?: "MALE" | "FEMALE";
    status?: string;
    medresaCourseId?: string;
    search?: string;
  }
): Prisma.StudentWhereInput => ({
  deleted_at: null,
  current_medresa_id: medresaId,
  ...(filters.gender ? { gender: filters.gender } : {}),
  ...(filters.status ? { status: filters.status as Prisma.EnumStudentStatusFilter["equals"] } : {}),
  ...(filters.medresaCourseId
    ? {
        student_courses: {
          some: { medresa_course_id: filters.medresaCourseId, deleted_at: null },
        },
      }
    : {}),
  ...(filters.search ? { OR: buildStudentSearchOr(filters.search) } : {}),
});
