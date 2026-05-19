import { AuditAction, Status } from "../../../prisma/generated/prisma/enums";
import { auditLog } from "../../lib/audit";
import { assertMedresaActive } from "../../lib/medresa-scope";
import { prisma } from "../../lib/prisma";
import type { AssignTeacherToCourseInput } from "./course.schema";

const activeAssignmentWhere = {
  deleted_at: null,
} as const;

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

export const assignTeacherToCourse = async (
  medresaId: string,
  medresaCourseId: string,
  input: AssignTeacherToCourseInput,
  performedBy: string
) => {
  const medresaCourse = await prisma.medresaCourse.findFirst({
    where: {
      id: medresaCourseId,
      medresa_id: medresaId,
      deleted_at: null,
      status: Status.ACTIVE,
    },
  });

  if (!medresaCourse) return { error: "MEDRESA_COURSE_NOT_FOUND" as const };

  const medresaActive = await assertMedresaActive(medresaId);
  if (!medresaActive) return { error: "MEDRESA_INACTIVE" as const };

  const teacherInMedresa = await ensureTeacherInMedresa(input.teacherId, medresaId);
  if (!teacherInMedresa) return { error: "TEACHER_NOT_IN_MEDRESA" as const };

  const assignment = await prisma.$transaction(async (tx) => {
    await tx.courseAssignment.updateMany({
      where: {
        medresa_course_id: medresaCourseId,
        ...activeAssignmentWhere,
      },
      data: { deleted_at: new Date() },
    });

    const existing = await tx.courseAssignment.findFirst({
      where: {
        medresa_course_id: medresaCourseId,
        teacher_id: input.teacherId,
      },
    });

    if (existing) {
      return tx.courseAssignment.update({
        where: { id: existing.id },
        data: {
          deleted_at: null,
          assigned_since: new Date(),
        },
        include: {
          teacher: { select: { id: true, full_name: true } },
        },
      });
    }

    return tx.courseAssignment.create({
      data: {
        medresa_course_id: medresaCourseId,
        teacher_id: input.teacherId,
      },
      include: {
        teacher: { select: { id: true, full_name: true } },
      },
    });
  });

  await auditLog({
    tableName: "CourseAssignment",
    recordId: assignment.id,
    action: AuditAction.INSERT,
    performedBy,
    newValues: {
      medresaCourseId,
      teacherId: input.teacherId,
      medresaId,
    },
  });

  return {
    assignment: {
      id: assignment.id,
      teacherId: assignment.teacher.id,
      fullName: assignment.teacher.full_name,
      assignedSince: assignment.assigned_since,
    },
  };
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
