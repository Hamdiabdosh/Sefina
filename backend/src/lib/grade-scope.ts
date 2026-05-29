import type { Request } from "express";
import { Status, StudentStatus } from "../../prisma/generated/prisma/enums";
import { prisma } from "./prisma";
import { teacherCanAccessMedresaCourse } from "./course-access";
import { canReadStudent, hasMedresaAdminRole, loadStudentForAccess } from "./student-scope";

export const getActiveTeacherIdForUser = async (userId: string): Promise<string | null> => {
  const teacher = await prisma.teacher.findFirst({
    where: { user_id: userId, deleted_at: null, status: Status.ACTIVE },
    select: { id: true },
  });
  return teacher?.id ?? null;
};

export const loadMedresaCourseContext = async (medresaCourseId: string) =>
  prisma.medresaCourse.findFirst({
    where: { id: medresaCourseId, deleted_at: null },
    select: {
      id: true,
      medresa_id: true,
      status: true,
      course: { select: { name: true } },
    },
  });

export const teacherCanGradeCourse = async (
  userId: string,
  medresaCourseId: string
): Promise<boolean> => {
  const mc = await loadMedresaCourseContext(medresaCourseId);
  if (!mc || mc.status !== Status.ACTIVE) return false;
  return teacherCanAccessMedresaCourse(userId, medresaCourseId, mc.medresa_id);
};

export const studentEnrolledInCourse = async (
  studentId: string,
  medresaCourseId: string
): Promise<boolean> => {
  const row = await prisma.studentCourse.findFirst({
    where: {
      student_id: studentId,
      medresa_course_id: medresaCourseId,
      deleted_at: null,
      student: { deleted_at: null, status: StudentStatus.ACTIVE },
    },
  });
  return row !== null;
};

export const canReadStudentGrades = async (req: Request, studentId: string): Promise<boolean> => {
  const row = await loadStudentForAccess(studentId);
  if (!row) return false;
  return canReadStudent(req, row);
};

export const canApproveGradeEditForMedresa = (req: Request, medresaId: string): boolean =>
  req.user!.isSuperAdmin === true || hasMedresaAdminRole(req, medresaId);

export const loadGradeWithMedresa = async (gradeId: string) =>
  prisma.grade.findFirst({
    where: { id: gradeId, deleted_at: null },
    include: {
      medresa_course: { select: { id: true, medresa_id: true } },
      teacher: { select: { id: true, user_id: true } },
    },
  });
