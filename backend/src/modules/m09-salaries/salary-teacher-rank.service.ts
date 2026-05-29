import type { Request } from "express";
import { Status } from "../../../prisma/generated/prisma/enums";
import { AuditAction } from "../../../prisma/generated/prisma/enums";
import { auditLog, getClientIp } from "../../lib/audit";
import { endOfEthiopianMonth, getEthiopianToday } from "../../lib/ethiopian-calendar";
import { prismaDateFromCalendarYmd } from "../../lib/ethiopia-time";
import { prisma } from "../../lib/prisma";
import type { AssignTeacherRankInput } from "./salary.schema";
import { centsToEtb, mapSalaryRank } from "./salary.mapper";

export type ResolvedTeacherRank = {
  teacherRankId: string;
  salaryRankId: string;
  rank: {
    id: string;
    name: unknown;
    monthly_amount: number;
    effective_from: Date;
    status: string;
  };
};

export const resolveCurrentTeacherRank = async (
  teacherId: string,
  month: number,
  year: number
): Promise<ResolvedTeacherRank | null> => {
  const cutoff = endOfEthiopianMonth(year, month);
  const assignment = await prisma.teacherRank.findFirst({
    where: {
      teacher_id: teacherId,
      deleted_at: null,
      effective_from: { lte: cutoff },
    },
    orderBy: { effective_from: "desc" },
    include: { salary_rank: true },
  });
  if (!assignment || assignment.salary_rank.deleted_at) return null;
  return {
    teacherRankId: assignment.id,
    salaryRankId: assignment.salary_rank_id,
    rank: assignment.salary_rank,
  };
};

export const assignTeacherRank = async (
  userId: string,
  teacherId: string,
  input: AssignTeacherRankInput,
  req: Request
) => {
  const teacher = await prisma.teacher.findFirst({
    where: { id: teacherId, deleted_at: null, status: Status.ACTIVE },
  });
  if (!teacher) return { error: "TEACHER_NOT_FOUND" as const };

  const rank = await prisma.salaryRank.findFirst({
    where: { id: input.salaryRankId, deleted_at: null, status: Status.ACTIVE },
  });
  if (!rank) return { error: "SALARY_RANK_NOT_FOUND" as const };

  const effectiveFrom = prismaDateFromCalendarYmd(input.effectiveFrom);
  const row = await prisma.teacherRank.create({
    data: {
      teacher_id: teacherId,
      salary_rank_id: input.salaryRankId,
      effective_from: effectiveFrom,
    },
    include: { salary_rank: true },
  });

  await auditLog({
    tableName: "TeacherRank",
    recordId: row.id,
    action: AuditAction.INSERT,
    performedBy: userId,
    newValues: {
      teacher_id: teacherId,
      salary_rank_id: input.salaryRankId,
      effective_from: input.effectiveFrom,
    },
    ip: getClientIp(req),
  });

  return {
    assignment: {
      id: row.id,
      teacherId: row.teacher_id,
      salaryRankId: row.salary_rank_id,
      effectiveFrom: row.effective_from.toISOString().slice(0, 10),
      rank: mapSalaryRank(row.salary_rank),
    },
  };
};

export const getTeacherRankHistory = async (teacherId: string) => {
  const teacher = await prisma.teacher.findFirst({
    where: { id: teacherId, deleted_at: null },
    select: { id: true, user: { select: { full_name: true } } },
  });
  if (!teacher) return { error: "TEACHER_NOT_FOUND" as const };

  const rows = await prisma.teacherRank.findMany({
    where: { teacher_id: teacherId, deleted_at: null },
    orderBy: { effective_from: "desc" },
    include: { salary_rank: true },
  });

  return {
    teacherId: teacher.id,
    fullName: teacher.user.full_name,
    items: rows.map((r) => ({
      id: r.id,
      salaryRankId: r.salary_rank_id,
      effectiveFrom: r.effective_from.toISOString().slice(0, 10),
      rank: mapSalaryRank(r.salary_rank),
      monthlyAmountEtb: centsToEtb(r.salary_rank.monthly_amount),
    })),
  };
};

/** Count teachers whose current rank (today) uses this salary_rank_id. */
export const countTeachersOnRank = async (salaryRankId: string): Promise<number> => {
  const today = getEthiopianToday();
  const teachers = await prisma.teacher.findMany({
    where: { deleted_at: null, status: Status.ACTIVE },
    select: { id: true },
  });
  let count = 0;
  for (const t of teachers) {
    const resolved = await resolveCurrentTeacherRank(t.id, today.month, today.year);
    if (resolved?.salaryRankId === salaryRankId) count += 1;
  }
  return count;
};
