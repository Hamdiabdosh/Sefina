import { Status } from "../../../prisma/generated/prisma/enums";
import {
  getEthiopianToday,
  iterateEthiopianMonths,
} from "../../lib/ethiopian-calendar";
import { prisma } from "../../lib/prisma";
import type { SalaryOverviewQuery, SalaryPaymentListQuery } from "./salary.schema";
import {
  centsToEtb,
  type SalaryPaymentListRowDto,
  type SalaryPaymentListStatus,
} from "./salary.mapper";
import { resolveCurrentTeacherRank } from "./salary-teacher-rank.service";

export const getSalaryPaymentList = async (query: SalaryPaymentListQuery) => {
  const { month, year, status: statusFilter = "ALL", rankId } = query;

  const teachers = await prisma.teacher.findMany({
    where: { deleted_at: null, status: Status.ACTIVE },
    orderBy: { full_name: "asc" },
    select: { id: true, full_name: true, photo_url: true },
  });

  const payments = await prisma.salaryPayment.findMany({
    where: { month, year, deleted_at: null },
  });
  const paymentByTeacher = new Map(payments.map((p) => [p.teacher_id, p]));

  const rows: SalaryPaymentListRowDto[] = [];
  let totalDisbursedCents = 0;
  let unpaidCount = 0;

  for (const teacher of teachers) {
    const resolved = await resolveCurrentTeacherRank(teacher.id, month, year);
    const payment = paymentByTeacher.get(teacher.id);
    const listStatus: SalaryPaymentListStatus = payment ? "PAID" : "UNPAID";

    if (rankId && resolved?.salaryRankId !== rankId) continue;
    if (statusFilter !== "ALL" && listStatus !== statusFilter) continue;

    if (listStatus === "UNPAID") unpaidCount += 1;
    if (payment) totalDisbursedCents += payment.amount_paid;

    rows.push({
      teacherId: teacher.id,
      fullName: teacher.full_name,
      photoUrl: teacher.photo_url,
      salaryRankId: resolved?.salaryRankId ?? null,
      rankName: resolved ? (resolved.rank.name as Record<string, string>) : null,
      monthlyAmountEtb: resolved ? centsToEtb(resolved.rank.monthly_amount) : null,
      month,
      year,
      status: listStatus,
      paymentId: payment?.id ?? null,
      amountPaidEtb: payment ? centsToEtb(payment.amount_paid) : null,
    });
  }

  return {
    month,
    year,
    items: rows,
    summary: {
      totalTeachers: teachers.length,
      listedCount: rows.length,
      unpaidCount,
      totalDisbursedEtb: centsToEtb(totalDisbursedCents),
    },
  };
};

export const getTeacherSalaryHistory = async (teacherId: string) => {
  const teacher = await prisma.teacher.findFirst({
    where: { id: teacherId, deleted_at: null },
    select: { id: true, full_name: true, photo_url: true },
  });
  if (!teacher) return { error: "TEACHER_NOT_FOUND" as const };

  const today = getEthiopianToday();
  const current = await resolveCurrentTeacherRank(teacherId, today.month, today.year);

  const payments = await prisma.salaryPayment.findMany({
    where: { teacher_id: teacherId, deleted_at: null },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { salary_rank: true },
  });

  const ytdPaidCents = payments
    .filter((p) => p.year === today.year)
    .reduce((sum, p) => sum + p.amount_paid, 0);

  return {
    teacherId: teacher.id,
    fullName: teacher.full_name,
    photoUrl: teacher.photo_url,
    currentRank: current
      ? {
          salaryRankId: current.salaryRankId,
          rankName: current.rank.name as Record<string, string>,
          monthlyAmountEtb: centsToEtb(current.rank.monthly_amount),
        }
      : null,
    totalPaidThisYearEtb: centsToEtb(ytdPaidCents),
    items: payments.map((p) => ({
      id: p.id,
      month: p.month,
      year: p.year,
      salaryRankId: p.salary_rank_id,
      rankName: p.salary_rank.name as Record<string, string>,
      amountPaidEtb: centsToEtb(p.amount_paid),
      bankReference: p.bank_reference,
      paymentDate: p.payment_date.toISOString().slice(0, 10),
      note: p.note,
      isAdjusted: p.is_adjusted,
      adjustmentReason: p.adjustment_reason,
    })),
  };
};

export const getNetworkSalaryOverview = async (query: SalaryOverviewQuery) => {
  const start = { month: query.fromMonth, year: query.fromYear };
  const end = { month: query.toMonth, year: query.toYear };

  const activeTeacherCount = await prisma.teacher.count({
    where: { deleted_at: null, status: Status.ACTIVE },
  });

  const items: Array<{
    month: number;
    year: number;
    teacherCount: number;
    paidCount: number;
    unpaidCount: number;
    totalDisbursedEtb: number;
  }> = [];

  for (const { month, year } of iterateEthiopianMonths(start, end)) {
    const payments = await prisma.salaryPayment.findMany({
      where: {
        month,
        year,
        deleted_at: null,
        ...(query.rankId ? { salary_rank_id: query.rankId } : {}),
      },
    });

    const paidTeacherIds = new Set(payments.map((p) => p.teacher_id));
    let paidCount = paidTeacherIds.size;
    let totalCents = payments.reduce((s, p) => s + p.amount_paid, 0);

    if (query.rankId) {
      const teachers = await prisma.teacher.findMany({
        where: { deleted_at: null, status: Status.ACTIVE },
        select: { id: true },
      });
      let eligible = 0;
      for (const t of teachers) {
        const r = await resolveCurrentTeacherRank(t.id, month, year);
        if (r?.salaryRankId === query.rankId) eligible += 1;
      }
      paidCount = payments.length;
      items.push({
        month,
        year,
        teacherCount: eligible,
        paidCount,
        unpaidCount: Math.max(0, eligible - paidCount),
        totalDisbursedEtb: centsToEtb(totalCents),
      });
    } else {
      items.push({
        month,
        year,
        teacherCount: activeTeacherCount,
        paidCount,
        unpaidCount: Math.max(0, activeTeacherCount - paidCount),
        totalDisbursedEtb: centsToEtb(totalCents),
      });
    }
  }

  return { items };
};

/** Used by salary cron — count unpaid for a given Ethiopian month. */
export const countUnpaidTeachersForMonth = async (
  month: number,
  year: number
): Promise<number> => {
  const teachers = await prisma.teacher.findMany({
    where: { deleted_at: null, status: Status.ACTIVE },
    select: { id: true },
  });
  const payments = await prisma.salaryPayment.findMany({
    where: { month, year, deleted_at: null },
    select: { teacher_id: true },
  });
  const paid = new Set(payments.map((p) => p.teacher_id));
  return teachers.filter((t) => !paid.has(t.id)).length;
};
