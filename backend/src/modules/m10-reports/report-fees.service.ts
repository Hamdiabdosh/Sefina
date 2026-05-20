import type { Request } from "express";
import { Status, StudentStatus } from "../../../prisma/generated/prisma/enums";
import { endOfEthiopianMonth, iterateEthiopianMonths } from "../../lib/ethiopian-calendar";
import { prisma } from "../../lib/prisma";
import { centsToEtb } from "./report.mapper";
import { assertMedresaReportAccess } from "./report-scope";
import type { ReportRangeQuery } from "./report.schema";

type FeeRowStatus = "PAID" | "PARTIAL" | "UNPAID";

const resolveFeeAmountCentsForMonth = async (
  month: number,
  year: number
): Promise<number | null> => {
  const cutoff = endOfEthiopianMonth(year, month);
  const row = await prisma.feeStructure.findFirst({
    where: {
      deleted_at: null,
      status: Status.ACTIVE,
      effective_from: { lte: cutoff },
    },
    orderBy: { effective_from: "desc" },
  });
  return row?.monthly_amount ?? null;
};

export const getFeesReport = async (req: Request, query: ReportRangeQuery) => {
  const access = assertMedresaReportAccess(req, query.medresaId);
  if ("error" in access) return access;

  if (!req.user!.isSuperAdmin && !query.medresaId && !access.medresaId) {
    return { error: "MEDRESA_REQUIRED" as const };
  }

  const medresaId = query.medresaId ?? access.medresaId;
  if (!medresaId && req.user!.isSuperAdmin) {
    return getNetworkFeesReport(req, query);
  }
  if (!medresaId) return { error: "MEDRESA_REQUIRED" as const };

  const items: Array<{
    studentId: string;
    fullName: string;
    month: number;
    year: number;
    amountDueEtb: number;
    amountPaidEtb: number;
    balanceEtb: number;
    status: FeeRowStatus;
  }> = [];

  for (const { month, year } of iterateEthiopianMonths(
    { month: query.fromMonth, year: query.fromYear },
    { month: query.toMonth, year: query.toYear }
  )) {
    const monthlyFee = await resolveFeeAmountCentsForMonth(month, year);
    if (monthlyFee === null) continue;

    const students = await prisma.student.findMany({
      where: {
        current_medresa_id: medresaId,
        deleted_at: null,
        status: StudentStatus.ACTIVE,
      },
      select: { id: true, full_name: true, enrolled_at: true },
    });

    for (const s of students) {
      const payments = await prisma.feePayment.findMany({
        where: {
          student_id: s.id,
          medresa_id: medresaId,
          month,
          year,
          deleted_at: null,
        },
        select: { amount_paid: true },
      });
      const paidCents = payments.reduce((sum, p) => sum + p.amount_paid, 0);
      const amountDueCents = monthlyFee;
      const balanceCents = Math.max(0, amountDueCents - paidCents);
      let status: FeeRowStatus = "PARTIAL";
      if (balanceCents <= 0) status = "PAID";
      else if (paidCents === 0) status = "UNPAID";

      if (query.feeStatus && query.feeStatus !== "ALL" && status !== query.feeStatus) {
        continue;
      }

      items.push({
        studentId: s.id,
        fullName: s.full_name,
        month,
        year,
        amountDueEtb: centsToEtb(amountDueCents),
        amountPaidEtb: centsToEtb(paidCents),
        balanceEtb: centsToEtb(balanceCents),
        status,
      });
    }
  }

  const totalDue = items.reduce((s, r) => s + r.amountDueEtb, 0);
  const totalPaid = items.reduce((s, r) => s + r.amountPaidEtb, 0);
  const collectionRate =
    totalDue > 0 ? Math.round((totalPaid / totalDue) * 10000) / 100 : null;

  return {
    medresaId,
    fromMonth: query.fromMonth,
    fromYear: query.fromYear,
    toMonth: query.toMonth,
    toYear: query.toYear,
    summary: {
      totalDueEtb: Math.round(totalDue * 100) / 100,
      totalCollectedEtb: Math.round(totalPaid * 100) / 100,
      collectionRatePercent: collectionRate,
    },
    items,
  };
};

const getNetworkFeesReport = async (req: Request, query: ReportRangeQuery) => {
  if (!req.user!.isSuperAdmin) return { error: "FORBIDDEN" as const };

  const medresas = await prisma.medresa.findMany({
    where: { deleted_at: null, ...(query.medresaId ? { id: query.medresaId } : {}) },
    select: { id: true, name: true },
  });

  const items: Array<{
    medresaId: string;
    medresaName: string;
    month: number;
    year: number;
    totalDueEtb: number;
    totalCollectedEtb: number;
    collectionRatePercent: number | null;
  }> = [];

  for (const m of medresas) {
    for (const { month, year } of iterateEthiopianMonths(
      { month: query.fromMonth, year: query.fromYear },
      { month: query.toMonth, year: query.toYear }
    )) {
      const monthlyFee = await resolveFeeAmountCentsForMonth(month, year);
      if (monthlyFee === null) continue;
      const studentCount = await prisma.student.count({
        where: {
          current_medresa_id: m.id,
          deleted_at: null,
          status: StudentStatus.ACTIVE,
        },
      });
      const payments = await prisma.feePayment.findMany({
        where: { medresa_id: m.id, month, year, deleted_at: null },
        select: { amount_paid: true },
      });
      const paidCents = payments.reduce((s, p) => s + p.amount_paid, 0);
      const dueCents = monthlyFee * studentCount;
      const totalDueEtb = centsToEtb(dueCents);
      const totalCollectedEtb = centsToEtb(paidCents);
      const collectionRate =
        totalDueEtb > 0
          ? Math.round((totalCollectedEtb / totalDueEtb) * 10000) / 100
          : null;
      items.push({
        medresaId: m.id,
        medresaName: m.name,
        month,
        year,
        totalDueEtb,
        totalCollectedEtb,
        collectionRatePercent: collectionRate,
      });
    }
  }

  return {
    fromMonth: query.fromMonth,
    fromYear: query.fromYear,
    toMonth: query.toMonth,
    toYear: query.toYear,
    items,
  };
};
