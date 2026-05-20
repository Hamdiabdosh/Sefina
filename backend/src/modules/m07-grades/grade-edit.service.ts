import type { Request } from "express";
import {
  ApprovalStatus,
  AuditAction,
  MedresaRole,
  Status,
} from "../../../prisma/generated/prisma/enums";
import { auditLog, getClientIp } from "../../lib/audit";
import { scoreToLetterGrade } from "../../lib/letter-grade";
import {
  canApproveGradeEditForMedresa,
  getActiveTeacherIdForUser,
  loadGradeWithMedresa,
} from "../../lib/grade-scope";
import { prisma } from "../../lib/prisma";
import type {
  CreateGradeEditRequestInput,
  ListGradeEditRequestsQuery,
  RejectGradeEditRequestInput,
} from "./grade.schema";
import { mapGrade, mapGradeEditRequest } from "./grade.mapper";

export const createGradeEditRequest = async (
  userId: string,
  gradeId: string,
  input: CreateGradeEditRequestInput,
  req: Request
) => {
  const teacherId = await getActiveTeacherIdForUser(userId);
  if (!teacherId) return { error: "FORBIDDEN" as const };

  const grade = await loadGradeWithMedresa(gradeId);
  if (!grade) return { error: "GRADE_NOT_FOUND" as const };
  if (grade.teacher_id !== teacherId) return { error: "FORBIDDEN" as const };

  const examType = await prisma.examType.findFirst({
    where: { id: grade.exam_type_id, deleted_at: null, status: Status.ACTIVE },
  });
  if (!examType) return { error: "EXAM_TYPE_NOT_FOUND" as const };
  if (input.requestedScore > examType.max_score) return { error: "SCORE_OUT_OF_RANGE" as const };

  const pending = await prisma.gradeEditRequest.findFirst({
    where: {
      grade_id: gradeId,
      status: ApprovalStatus.PENDING,
      deleted_at: null,
    },
  });
  if (pending) return { error: "PENDING_REQUEST_EXISTS" as const };

  const row = await prisma.gradeEditRequest.create({
    data: {
      grade_id: gradeId,
      requested_by: teacherId,
      current_score: grade.numeric_score,
      requested_score: input.requestedScore,
      reason: input.reason,
      status: ApprovalStatus.PENDING,
    },
    include: {
      grade: {
        include: {
          student: { select: { full_name: true } },
          medresa_course: {
            select: {
              medresa_id: true,
              course: { select: { name: true } },
            },
          },
          exam_type: { select: { name: true } },
          teacher: { select: { full_name: true } },
        },
      },
    },
  });

  await auditLog({
    tableName: "GradeEditRequest",
    recordId: row.id,
    action: AuditAction.INSERT,
    performedBy: userId,
    newValues: { requested_score: input.requestedScore, reason: input.reason },
    ip: getClientIp(req),
  });

  return { request: mapGradeEditRequest(row) };
};

export const listGradeEditRequests = async (
  req: Request,
  query: ListGradeEditRequestsQuery
) => {
  const status = query.status ?? ApprovalStatus.PENDING;
  const medresaFilter = query.medresaId;

  if (!req.user!.isSuperAdmin && medresaFilter) {
    if (!canApproveGradeEditForMedresa(req, medresaFilter)) {
      return { error: "FORBIDDEN" as const };
    }
  }

  const medresaIds = req.user!.isSuperAdmin
    ? medresaFilter
      ? [medresaFilter]
      : undefined
    : (req.user!.medresaRoles ?? [])
        .filter((r) => r.role === MedresaRole.ADMIN)
        .map((r) => r.medresaId);

  if (!req.user!.isSuperAdmin && (!medresaIds || medresaIds.length === 0)) {
    return { error: "FORBIDDEN" as const };
  }

  const rows = await prisma.gradeEditRequest.findMany({
    where: {
      deleted_at: null,
      status,
      grade: {
        deleted_at: null,
        medresa_course: medresaIds
          ? { medresa_id: { in: medresaIds } }
          : undefined,
      },
    },
    include: {
      grade: {
        include: {
          student: { select: { full_name: true } },
          medresa_course: {
            select: {
              medresa_id: true,
              course: { select: { name: true } },
            },
          },
          exam_type: { select: { name: true } },
          teacher: { select: { full_name: true } },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return { items: rows.map(mapGradeEditRequest) };
};

export const approveGradeEditRequest = async (
  req: Request,
  requestId: string
) => {
  const row = await prisma.gradeEditRequest.findFirst({
    where: { id: requestId, deleted_at: null, status: ApprovalStatus.PENDING },
    include: {
      grade: {
        include: { medresa_course: { select: { medresa_id: true } }, exam_type: true },
      },
    },
  });
  if (!row) return { error: "REQUEST_NOT_FOUND" as const };

  const medresaId = row.grade.medresa_course.medresa_id;
  if (!canApproveGradeEditForMedresa(req, medresaId)) {
    return { error: "FORBIDDEN" as const };
  }

  if (row.requested_score > row.grade.exam_type.max_score) {
    return { error: "SCORE_OUT_OF_RANGE" as const };
  }

  const letterGrade = scoreToLetterGrade(row.requested_score);

  const [updatedGrade, updatedRequest] = await prisma.$transaction([
    prisma.grade.update({
      where: { id: row.grade_id },
      data: {
        numeric_score: row.requested_score,
        letter_grade: letterGrade,
      },
      select: {
        id: true,
        student_id: true,
        medresa_course_id: true,
        exam_type_id: true,
        teacher_id: true,
        numeric_score: true,
        letter_grade: true,
        submitted_at: true,
      },
    }),
    prisma.gradeEditRequest.update({
      where: { id: requestId },
      data: {
        status: ApprovalStatus.APPROVED,
        reviewed_by: req.user!.userId,
        reviewed_at: new Date(),
      },
      include: {
        grade: {
          include: {
            student: { select: { full_name: true } },
            medresa_course: {
              select: { medresa_id: true, course: { select: { name: true } } },
            },
            exam_type: { select: { name: true } },
            teacher: { select: { full_name: true } },
          },
        },
      },
    }),
  ]);

  await auditLog({
    tableName: "Grade",
    recordId: row.grade_id,
    action: AuditAction.UPDATE,
    performedBy: req.user!.userId,
    oldValues: { numeric_score: row.current_score },
    newValues: { numeric_score: row.requested_score, letter_grade: letterGrade },
    ip: getClientIp(req),
  });

  await auditLog({
    tableName: "GradeEditRequest",
    recordId: requestId,
    action: AuditAction.UPDATE,
    performedBy: req.user!.userId,
    newValues: { status: ApprovalStatus.APPROVED },
    ip: getClientIp(req),
  });

  return {
    grade: mapGrade(updatedGrade),
    request: mapGradeEditRequest(updatedRequest),
  };
};

export const rejectGradeEditRequest = async (
  req: Request,
  requestId: string,
  input: RejectGradeEditRequestInput
) => {
  const row = await prisma.gradeEditRequest.findFirst({
    where: { id: requestId, deleted_at: null, status: ApprovalStatus.PENDING },
    include: {
      grade: { include: { medresa_course: { select: { medresa_id: true } } } },
    },
  });
  if (!row) return { error: "REQUEST_NOT_FOUND" as const };

  if (!canApproveGradeEditForMedresa(req, row.grade.medresa_course.medresa_id)) {
    return { error: "FORBIDDEN" as const };
  }

  const updated = await prisma.gradeEditRequest.update({
    where: { id: requestId },
    data: {
      status: ApprovalStatus.REJECTED,
      reviewed_by: req.user!.userId,
      reviewed_at: new Date(),
      rejection_reason: input.rejectionReason,
    },
    include: {
      grade: {
        include: {
          student: { select: { full_name: true } },
          medresa_course: {
            select: { medresa_id: true, course: { select: { name: true } } },
          },
          exam_type: { select: { name: true } },
          teacher: { select: { full_name: true } },
        },
      },
    },
  });

  await auditLog({
    tableName: "GradeEditRequest",
    recordId: requestId,
    action: AuditAction.UPDATE,
    performedBy: req.user!.userId,
    newValues: { status: ApprovalStatus.REJECTED, rejection_reason: input.rejectionReason },
    ip: getClientIp(req),
  });

  return { request: mapGradeEditRequest(updated) };
};
