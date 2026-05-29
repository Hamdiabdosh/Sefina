import { Status } from "../../prisma/generated/prisma/enums";
import { prisma } from "./prisma";

export const ensureTeacherInMedresa = async (
  teacherId: string,
  medresaId: string
): Promise<boolean> => {
  const row = await prisma.teacherMedresa.findFirst({
    where: {
      teacher_id: teacherId,
      medresa_id: medresaId,
      deleted_at: null,
      teacher: { deleted_at: null, status: Status.ACTIVE },
    },
  });
  return row !== null;
};

export const teacherCanAccessMedresaCourse = async (
  userId: string,
  medresaCourseId: string,
  medresaId: string
): Promise<boolean> => {
  const teacher = await prisma.teacher.findFirst({
    where: { user_id: userId, deleted_at: null, status: Status.ACTIVE },
    select: { id: true },
  });
  if (!teacher) return false;

  const assignment = await prisma.courseAssignment.findFirst({
    where: {
      medresa_course_id: medresaCourseId,
      teacher_id: teacher.id,
      deleted_at: null,
      medresa_course: {
        medresa_id: medresaId,
        deleted_at: null,
      },
    },
  });

  return assignment !== null;
};
