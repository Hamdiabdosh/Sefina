import type { Request } from "express";
import { MedresaRole, Status } from "../../../prisma/generated/prisma/enums";
import { getActiveTeacherIdForUser } from "../../lib/grade-scope";
import { hasMedresaAdminRole } from "../../lib/student-scope";
import { prisma } from "../../lib/prisma";

export const getAdminMedresaIds = (req: Request): string[] => {
  if (req.user!.isSuperAdmin) return [];
  return (req.user!.medresaRoles ?? [])
    .filter((r) => r.role === MedresaRole.ADMIN)
    .map((r) => r.medresaId);
};

export const canAccessMedresa = (req: Request, medresaId: string): boolean =>
  req.user!.isSuperAdmin === true || hasMedresaAdminRole(req, medresaId);

export const resolveMedresaIdForDashboard = (
  req: Request,
  queryMedresaId?: string
): { medresaId: string } | { error: "FORBIDDEN" } | { error: "MEDRESA_REQUIRED" } => {
  if (req.user!.isSuperAdmin) {
    if (!queryMedresaId) return { error: "MEDRESA_REQUIRED" };
    return { medresaId: queryMedresaId };
  }
  const adminIds = getAdminMedresaIds(req);
  if (adminIds.length === 0) return { error: "FORBIDDEN" };
  if (queryMedresaId) {
    if (!adminIds.includes(queryMedresaId)) return { error: "FORBIDDEN" };
    return { medresaId: queryMedresaId };
  }
  return { medresaId: adminIds[0]! };
};

export const assertMedresaReportAccess = (
  req: Request,
  medresaId?: string
): { ok: true; medresaId?: string } | { error: "FORBIDDEN" } => {
  if (req.user!.isSuperAdmin) return { ok: true, medresaId };
  if (!medresaId) {
    const ids = getAdminMedresaIds(req);
    if (ids.length === 0) return { error: "FORBIDDEN" };
    return { ok: true };
  }
  if (!canAccessMedresa(req, medresaId)) return { error: "FORBIDDEN" };
  return { ok: true, medresaId };
};

export const getTeacherAssignedCourseIds = async (userId: string): Promise<string[]> => {
  const teacherId = await getActiveTeacherIdForUser(userId);
  if (!teacherId) return [];
  const rows = await prisma.courseAssignment.findMany({
    where: {
      teacher_id: teacherId,
      deleted_at: null,
      medresa_course: { deleted_at: null, status: Status.ACTIVE },
    },
    select: { medresa_course_id: true },
  });
  return rows.map((r) => r.medresa_course_id);
};

export const teacherAssignedToCourse = async (
  userId: string,
  medresaCourseId: string
): Promise<boolean> => {
  const ids = await getTeacherAssignedCourseIds(userId);
  return ids.includes(medresaCourseId);
};

export const assertCourseReportAccess = async (
  req: Request,
  medresaCourseId?: string
): Promise<{ ok: true } | { error: "FORBIDDEN" } | { error: "COURSE_REQUIRED" }> => {
  if (req.user!.isSuperAdmin) return { ok: true };
  if (medresaCourseId) {
    const mc = await prisma.medresaCourse.findFirst({
      where: { id: medresaCourseId, deleted_at: null },
      select: { medresa_id: true },
    });
    if (!mc) return { error: "FORBIDDEN" };
    if (req.user!.isSuperAdmin) return { ok: true };
    if (hasMedresaAdminRole(req, mc.medresa_id)) return { ok: true };
    if (await teacherAssignedToCourse(req.user!.userId, medresaCourseId)) return { ok: true };
    return { error: "FORBIDDEN" };
  }
  const isTeacher = (req.user!.medresaRoles ?? []).some((r) => r.role === MedresaRole.TEACHER);
  if (isTeacher && !req.user!.isSuperAdmin) return { error: "COURSE_REQUIRED" };
  const adminIds = getAdminMedresaIds(req);
  if (adminIds.length > 0 || req.user!.isSuperAdmin) return { ok: true };
  return { error: "FORBIDDEN" };
};
