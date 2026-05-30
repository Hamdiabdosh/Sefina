import { MedresaRole } from "../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { centsToEtb } from "./salary.mapper";
import { resolveCurrentTeacherRank } from "./salary-teacher-rank.service";

/** Flat monthly salary for admin-only teachers (no TEACHER role at any medresa). */
export const ADMIN_ONLY_SALARY_ETB = 2500;

export type SalaryBreakdown = "TEACHER_MULTI" | "ADMIN_ONLY" | "TEACHER_ADMIN_COMBINED";

export type ComputedTeacherSalary = {
  amountEtb: number;
  breakdown: SalaryBreakdown;
  medresaCount: number;
  rankAmountEtb: number | null;
  rankId: string | null;
};

export const computeTeacherSalary = async (
  teacherId: string,
  month: number,
  year: number
): Promise<ComputedTeacherSalary> => {
  const assignments = await prisma.teacherMedresa.findMany({
    where: { teacher_id: teacherId, deleted_at: null },
    select: { role: true },
  });

  const teacherMedresaCount = assignments.filter((a) => a.role === MedresaRole.TEACHER).length;
  const adminMedresaCount = assignments.filter((a) => a.role === MedresaRole.ADMIN).length;

  const resolved = await resolveCurrentTeacherRank(teacherId, month, year);

  if (teacherMedresaCount > 0) {
    const rankAmountEtb = resolved ? centsToEtb(resolved.rank.monthly_amount) : null;
    return {
      amountEtb: (rankAmountEtb ?? 0) * teacherMedresaCount,
      breakdown: adminMedresaCount > 0 ? "TEACHER_ADMIN_COMBINED" : "TEACHER_MULTI",
      medresaCount: teacherMedresaCount,
      rankAmountEtb,
      rankId: resolved?.salaryRankId ?? null,
    };
  }

  if (adminMedresaCount > 0) {
    return {
      amountEtb: ADMIN_ONLY_SALARY_ETB,
      breakdown: "ADMIN_ONLY",
      medresaCount: 0,
      rankAmountEtb: null,
      rankId: null,
    };
  }

  return {
    amountEtb: 0,
    breakdown: "ADMIN_ONLY",
    medresaCount: 0,
    rankAmountEtb: null,
    rankId: null,
  };
};
