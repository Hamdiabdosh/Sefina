import { prisma } from "./prisma";

/** Same medresa, name (case-insensitive), and date of birth — active rows only. */
export const findDuplicateStudent = async (
  medresaId: string,
  fullName: string,
  dateOfBirth: Date,
  excludeStudentId?: string
) =>
  prisma.student.findFirst({
    where: {
      current_medresa_id: medresaId,
      deleted_at: null,
      full_name: { equals: fullName.trim(), mode: "insensitive" },
      date_of_birth: dateOfBirth,
      ...(excludeStudentId ? { id: { not: excludeStudentId } } : {}),
    },
    select: { id: true, enrollment_number: true },
  });
