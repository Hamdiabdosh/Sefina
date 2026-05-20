import type { Request } from "express";
import { Status } from "../../../prisma/generated/prisma/enums";
import { iterateEthiopianMonths } from "../../lib/ethiopian-calendar";
import { prisma } from "../../lib/prisma";
import { centsToEtb } from "./report.mapper";
import type { ReportRangeQuery } from "./report.schema";

export const getSalaryReport = async (req: Request, query: ReportRangeQuery) => {
  if (!req.user!.isSuperAdmin) return { error: "FORBIDDEN" as const };

  const items: Array<{
    teacherId: string;
    fullName: string;
    month: number;
    year: number;
    rankName: Record<string, string> | null;
    amountPaidEtb: number | null;
    bankReference: string | null;
    paymentDate: string | null;
    status: "PAID" | "UNPAID";
  }> = [];

  const teachers = await prisma.teacher.findMany({
    where: {
      deleted_at: null,
      status: Status.ACTIVE,
      ...(query.rankId
        ? {
            teacher_ranks: {
              some: { salary_rank_id: query.rankId, deleted_at: null },
            },
          }
        : {}),
    },
    select: { id: true, full_name: true },
    orderBy: { full_name: "asc" },
  });

  for (const { month, year } of iterateEthiopianMonths(
    { month: query.fromMonth, year: query.fromYear },
    { month: query.toMonth, year: query.toYear }
  )) {
    for (const t of teachers) {
      const payment = await prisma.salaryPayment.findFirst({
        where: { teacher_id: t.id, month, year, deleted_at: null },
        include: { salary_rank: { select: { name: true } } },
      });
      const status = payment ? "PAID" : "UNPAID";
      const ps = query.paymentStatus ?? "ALL";
      if (ps === "PAID" && !payment) continue;
      if (ps === "UNPAID" && payment) continue;

      items.push({
        teacherId: t.id,
        fullName: t.full_name,
        month,
        year,
        rankName: payment
          ? (payment.salary_rank.name as Record<string, string>)
          : null,
        amountPaidEtb: payment ? centsToEtb(payment.amount_paid) : null,
        bankReference: payment?.bank_reference ?? null,
        paymentDate: payment?.payment_date.toISOString().slice(0, 10) ?? null,
        status,
      });
    }
  }

  const paidCount = items.filter((i) => i.status === "PAID").length;
  const unpaidCount = items.filter((i) => i.status === "UNPAID").length;
  const totalDisbursedEtb = items.reduce((s, i) => s + (i.amountPaidEtb ?? 0), 0);

  return {
    fromMonth: query.fromMonth,
    fromYear: query.fromYear,
    toMonth: query.toMonth,
    toYear: query.toYear,
    summary: {
      paidCount,
      unpaidCount,
      totalDisbursedEtb: Math.round(totalDisbursedEtb * 100) / 100,
    },
    items,
  };
};
