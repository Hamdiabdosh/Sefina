import { Prisma } from "../../../prisma/generated/prisma/client";
import { AuditAction, Status } from "../../../prisma/generated/prisma/enums";
import { auditLog } from "../../lib/audit";
import { assertMedresaActive } from "../../lib/medresa-scope";
import { prisma } from "../../lib/prisma";
import { mapTeacherDetail, teacherInclude } from "./teacher.mapper";
import type {
  AssignMedresaInput,
  BulkAssignMedresaInput,
  UpdateAssignmentRoleInput,
} from "./teacher.schema";

const ensureActiveTeacher = async (teacherId: string) => {
  const teacher = await prisma.teacher.findFirst({
    where: { id: teacherId, deleted_at: null, status: Status.ACTIVE },
  });
  return teacher;
};

export const upsertAssignment = async (
  tx: Prisma.TransactionClient,
  teacherId: string,
  input: AssignMedresaInput
) => {
  const existing = await tx.teacherMedresa.findUnique({
    where: {
      teacher_id_medresa_id: {
        teacher_id: teacherId,
        medresa_id: input.medresaId,
      },
    },
  });

  const assignedSince = input.assignedSince ?? new Date();

  if (existing) {
    return tx.teacherMedresa.update({
      where: { id: existing.id },
      data: {
        role: input.role,
        assigned_since: assignedSince,
        deleted_at: null,
      },
    });
  }

  return tx.teacherMedresa.create({
    data: {
      teacher_id: teacherId,
      medresa_id: input.medresaId,
      role: input.role,
      assigned_since: assignedSince,
    },
  });
};

export const assignTeacherToMedresa = async (
  teacherId: string,
  input: AssignMedresaInput,
  performedBy: string
) => {
  const teacher = await ensureActiveTeacher(teacherId);
  if (!teacher) return { error: "TEACHER_NOT_FOUND" as const };

  const medresaActive = await assertMedresaActive(input.medresaId);
  if (!medresaActive) return { error: "MEDRESA_INACTIVE" as const };

  const assignment = await prisma.$transaction((tx) =>
    upsertAssignment(tx, teacherId, input)
  );

  await auditLog({
    tableName: "TeacherMedresa",
    recordId: assignment.id,
    action: AuditAction.INSERT,
    performedBy,
    newValues: {
      teacherId,
      medresaId: input.medresaId,
      role: input.role,
    },
  });

  return getTeacherByIdAfterAssign(teacherId);
};

export const bulkAssignTeacherToMedresas = async (
  teacherId: string,
  input: BulkAssignMedresaInput,
  performedBy: string
) => {
  const teacher = await ensureActiveTeacher(teacherId);
  if (!teacher) return { error: "TEACHER_NOT_FOUND" as const };

  for (const row of input.assignments) {
    const medresaActive = await assertMedresaActive(row.medresaId);
    if (!medresaActive) return { error: "MEDRESA_INACTIVE" as const, medresaId: row.medresaId };
  }

  await prisma.$transaction(async (tx) => {
    for (const row of input.assignments) {
      await upsertAssignment(tx, teacherId, row);
    }
  });

  await auditLog({
    tableName: "TeacherMedresa",
    recordId: teacherId,
    action: AuditAction.INSERT,
    performedBy,
    newValues: { event: "BULK_ASSIGN", count: input.assignments.length },
  });

  return getTeacherByIdAfterAssign(teacherId);
};

export const updateTeacherMedresaRole = async (
  teacherId: string,
  medresaId: string,
  input: UpdateAssignmentRoleInput,
  performedBy: string
) => {
  const assignment = await prisma.teacherMedresa.findFirst({
    where: { teacher_id: teacherId, medresa_id: medresaId, deleted_at: null },
  });

  if (!assignment) return { error: "ASSIGNMENT_NOT_FOUND" as const };

  await prisma.teacherMedresa.update({
    where: { id: assignment.id },
    data: { role: input.role },
  });

  await auditLog({
    tableName: "TeacherMedresa",
    recordId: assignment.id,
    action: AuditAction.UPDATE,
    performedBy,
    newValues: { role: input.role },
  });

  return getTeacherByIdAfterAssign(teacherId);
};

export const removeTeacherFromMedresa = async (
  teacherId: string,
  medresaId: string,
  performedBy: string
) => {
  const assignment = await prisma.teacherMedresa.findFirst({
    where: { teacher_id: teacherId, medresa_id: medresaId, deleted_at: null },
  });

  if (!assignment) return { error: "ASSIGNMENT_NOT_FOUND" as const };

  await prisma.teacherMedresa.update({
    where: { id: assignment.id },
    data: { deleted_at: new Date() },
  });

  await auditLog({
    tableName: "TeacherMedresa",
    recordId: assignment.id,
    action: AuditAction.SOFT_DELETE,
    performedBy,
    newValues: { event: "REMOVE_FROM_MEDRESA", medresaId },
  });

  return getTeacherByIdAfterAssign(teacherId);
};

const getTeacherByIdAfterAssign = async (teacherId: string) => {
  const teacher = await prisma.teacher.findFirst({
    where: { id: teacherId, deleted_at: null },
    include: teacherInclude,
  });
  return teacher ? mapTeacherDetail(teacher) : null;
};
