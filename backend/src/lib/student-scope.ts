import type { Request } from "express";
import { MedresaRole, Status } from "../../prisma/generated/prisma/enums";
import { prisma } from "./prisma";

export const hasMedresaAdminRole = (req: Request, medresaId: string): boolean =>
  req.user!.isSuperAdmin === true ||
  (req.user!.medresaRoles ?? []).some(
    (r) => r.medresaId === medresaId && r.role === MedresaRole.ADMIN
  );

export const loadStudentForAccess = async (studentId: string) =>
  prisma.student.findFirst({
    where: { id: studentId, deleted_at: null },
    select: {
      id: true,
      current_medresa_id: true,
      status: true,
      photo_url: true,
    },
  });

export const courseEligibleForEnrollment = async (
  medresaCourseId: string,
  medresaId: string
): Promise<{ eligible: true } | { eligible: false; error: string }> => {
  const medresaCourse = await prisma.medresaCourse.findFirst({
    where: {
      id: medresaCourseId,
      medresa_id: medresaId,
      deleted_at: null,
      status: Status.ACTIVE,
    },
    select: {
      id: true,
      assignments: {
        where: { deleted_at: null },
        take: 1,
        select: { id: true },
      },
    },
  });

  if (!medresaCourse) {
    return { eligible: false, error: "MEDRESA_COURSE_NOT_FOUND" };
  }

  if (medresaCourse.assignments.length === 0) {
    return { eligible: false, error: "COURSE_NO_TEACHER" };
  }

  return { eligible: true };
};

export const teacherCanAccessStudent = async (
  userId: string,
  studentId: string
): Promise<boolean> => {
  const teacher = await prisma.teacher.findFirst({
    where: { user_id: userId, deleted_at: null, status: Status.ACTIVE },
    select: { id: true },
  });
  if (!teacher) return false;

  const enrollment = await prisma.studentCourse.findFirst({
    where: {
      student_id: studentId,
      deleted_at: null,
      medresa_course: {
        deleted_at: null,
        assignments: {
          some: {
            teacher_id: teacher.id,
            deleted_at: null,
          },
        },
      },
    },
  });

  return enrollment !== null;
};

export const canReadStudent = async (
  req: Request,
  student: { id: string; current_medresa_id: string }
): Promise<boolean> => {
  if (req.user!.isSuperAdmin) return true;
  if (hasMedresaAdminRole(req, student.current_medresa_id)) return true;
  return teacherCanAccessStudent(req.user!.userId, student.id);
};

export const canWriteStudent = (req: Request, currentMedresaId: string): boolean =>
  hasMedresaAdminRole(req, currentMedresaId);
