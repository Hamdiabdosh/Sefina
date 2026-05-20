import type { Request } from "express";
import { MedresaRole, Status, StudentStatus } from "../../prisma/generated/prisma/enums";
import { prisma } from "./prisma";
import { hasMedresaAdminRole } from "./student-scope";

/** True when user has TEACHER role but no ADMIN role at any medresa (and not super admin). */
export const isTeacherOnly = (req: Request): boolean => {
  if (!req.user || req.user.isSuperAdmin) return false;
  const roles = req.user.medresaRoles ?? [];
  const hasTeacher = roles.some((r) => r.role === MedresaRole.TEACHER);
  const hasAdmin = roles.some((r) => r.role === MedresaRole.ADMIN);
  return hasTeacher && !hasAdmin;
};

export const canReadFees = (req: Request, medresaId: string): boolean =>
  req.user!.isSuperAdmin === true || hasMedresaAdminRole(req, medresaId);

export const canRecordFeePayment = (req: Request, medresaId: string): boolean =>
  hasMedresaAdminRole(req, medresaId) && !req.user!.isSuperAdmin;

export const canManageFeeStructure = (req: Request): boolean => req.user!.isSuperAdmin === true;

export const canVoidFeePayment = (req: Request): boolean => req.user!.isSuperAdmin === true;

export const studentBelongsToMedresa = async (
  studentId: string,
  medresaId: string
): Promise<boolean> => {
  const row = await prisma.student.findFirst({
    where: {
      id: studentId,
      current_medresa_id: medresaId,
      deleted_at: null,
      status: StudentStatus.ACTIVE,
    },
  });
  return row !== null;
};

export const assertMedresaActive = async (medresaId: string): Promise<boolean> => {
  const m = await prisma.medresa.findFirst({
    where: { id: medresaId, deleted_at: null, status: Status.ACTIVE },
  });
  return m !== null;
};
