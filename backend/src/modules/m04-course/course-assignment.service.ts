import { AuditAction, Status } from "../../../prisma/generated/prisma/enums";
import { auditLog } from "../../lib/audit";
import { ensureTeacherInMedresa } from "../../lib/course-access";
import { assertMedresaActive } from "../../lib/medresa-scope";
import { prisma } from "../../lib/prisma";
import type { AssignTeacherToCourseInput } from "./course.schema";

const activeAssignmentWhere = {
  deleted_at: null,
} as const;

export { ensureTeacherInMedresa, teacherCanAccessMedresaCourse } from "../../lib/course-access";

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
          teacher: { select: { id: true, user: { select: { full_name: true } } } },
        },
      });
    }

    return tx.courseAssignment.create({
      data: {
        medresa_course_id: medresaCourseId,
        teacher_id: input.teacherId,
      },
      include: {
        teacher: { select: { id: true, user: { select: { full_name: true } } } },
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
      fullName: assignment.teacher.user.full_name,
      assignedSince: assignment.assigned_since,
    },
  };
};
