/**
 * Fee ledger: collection rows, balances, carryover (BR-10).
 *
 * Per student for Ethiopian month (M, Y):
 *   monthlyFee = active structure amount for (M, Y)
 *   paidInMonth = sum(amount_paid) for payments in (M, Y)
 *   priorCarryover = max(0, lifetime obligations before M) - payments before M
 *   amountDue = monthlyFee + priorCarryover
 *   balance = amountDue - paidInMonth
 *   status: PAID if balance <= 0, UNPAID if paidInMonth === 0, else PARTIAL
 *
 * FeeBalance (denormalized): total_due = sum(monthly fees from enrollment→now),
 * total_paid = sum(all payments), outstanding_balance = total_due - total_paid
 */
import type { Request } from "express";
import { StudentStatus } from "../../../prisma/generated/prisma/enums";
import {
  ethiopianMonthCompare,
  getEthiopianToday,
  iterateEthiopianMonths,
  toEthiopian,
} from "../../lib/ethiopian-calendar";
import { assertMedresaActive, canReadFees, studentBelongsToMedresa } from "../../lib/fee-scope";
import { prisma } from "../../lib/prisma";
import { resolveFeeAmountCentsForMonth } from "./fee-structure.service";
import type { FeeCollectionQuery, FeeOverviewQuery, NetworkFeeOverviewQuery } from "./fee.schema";
import {
  centsToEtb,
  mapFeePayment,
  type FeeCollectionRowDto,
  type FeeCollectionStatus,
} from "./fee.mapper";

const enrollmentEthiopian = (enrolledAt: Date): { month: number; year: number } => {
  const et = toEthiopian(
    enrolledAt.getUTCFullYear(),
    enrolledAt.getUTCMonth() + 1,
    enrolledAt.getUTCDate()
  );
  return { month: et.month, year: et.year };
};

export const recomputeFeeBalance = async (studentId: string, medresaId: string) => {
  const student = await prisma.student.findFirst({
    where: { id: studentId, current_medresa_id: medresaId, deleted_at: null },
    select: { enrolled_at: true },
  });
  if (!student) return;

  const today = getEthiopianToday();
  const start = enrollmentEthiopian(student.enrolled_at);

  let totalDue = 0;
  for (const { month, year } of iterateEthiopianMonths(start, today)) {
    const fee = await resolveFeeAmountCentsForMonth(month, year);
    if (fee !== null) totalDue += fee;
  }

  const payments = await prisma.feePayment.findMany({
    where: { student_id: studentId, medresa_id: medresaId, deleted_at: null },
    select: { amount_paid: true },
  });
  const totalPaid = payments.reduce((s, p) => s + p.amount_paid, 0);
  const outstanding = Math.max(0, totalDue - totalPaid);

  await prisma.feeBalance.upsert({
    where: { student_id_medresa_id: { student_id: studentId, medresa_id: medresaId } },
    create: {
      student_id: studentId,
      medresa_id: medresaId,
      total_due: totalDue,
      total_paid: totalPaid,
      outstanding_balance: outstanding,
    },
    update: {
      total_due: totalDue,
      total_paid: totalPaid,
      outstanding_balance: outstanding,
    },
  });
};

const sumPaidBeforeMonth = async (
  studentId: string,
  medresaId: string,
  month: number,
  year: number
): Promise<number> => {
  const payments = await prisma.feePayment.findMany({
    where: { student_id: studentId, medresa_id: medresaId, deleted_at: null },
    select: { month: true, year: true, amount_paid: true },
  });
  return payments
    .filter((p) => ethiopianMonthCompare(p, { month, year }) < 0)
    .reduce((s, p) => s + p.amount_paid, 0);
};

const previousEthiopianMonth = (month: number, year: number): { month: number; year: number } => {
  if (month > 1) return { month: month - 1, year };
  return { month: 13, year: year - 1 };
};

const obligationsBeforeMonth = async (
  studentId: string,
  month: number,
  year: number
): Promise<number> => {
  const student = await prisma.student.findFirst({
    where: { id: studentId },
    select: { enrolled_at: true },
  });
  if (!student) return 0;
  const start = enrollmentEthiopian(student.enrolled_at);
  const end = previousEthiopianMonth(month, year);
  if (ethiopianMonthCompare(start, { month, year }) > 0) return 0;
  if (ethiopianMonthCompare(start, end) > 0) return 0;

  let total = 0;
  for (const m of iterateEthiopianMonths(start, end)) {
    const fee = await resolveFeeAmountCentsForMonth(m.month, m.year);
    if (fee !== null) total += fee;
  }
  return total;
};

export const computeCollectionRow = async (
  student: { id: string; full_name: string; photo_url: string | null; enrolled_at: Date },
  medresaId: string,
  month: number,
  year: number
): Promise<FeeCollectionRowDto | null> => {
  const monthlyFee = await resolveFeeAmountCentsForMonth(month, year);
  if (monthlyFee === null) return null;

  const payments = await prisma.feePayment.findMany({
    where: {
      student_id: student.id,
      medresa_id: medresaId,
      month,
      year,
      deleted_at: null,
    },
    select: { amount_paid: true },
  });
  const paidInMonth = payments.reduce((s, p) => s + p.amount_paid, 0);

  const priorObligations = await obligationsBeforeMonth(student.id, month, year);
  const priorPaid = await sumPaidBeforeMonth(student.id, medresaId, month, year);
  const priorCarryover = Math.max(0, priorObligations - priorPaid);

  const amountDue = monthlyFee + priorCarryover;
  const balance = amountDue - paidInMonth;

  let status: FeeCollectionStatus = "PARTIAL";
  if (balance <= 0) status = "PAID";
  else if (paidInMonth === 0) status = "UNPAID";

  return {
    studentId: student.id,
    fullName: student.full_name,
    photoUrl: student.photo_url,
    month,
    year,
    amountDueEtb: centsToEtb(amountDue),
    amountPaidEtb: centsToEtb(paidInMonth),
    balanceEtb: centsToEtb(Math.max(0, balance)),
    status,
  };
};

export const getFeeCollection = async (req: Request, medresaId: string, query: FeeCollectionQuery) => {
  if (!canReadFees(req, medresaId)) return { error: "FORBIDDEN" as const };
  if (!(await assertMedresaActive(medresaId))) return { error: "MEDRESA_INACTIVE" as const };

  const monthlyFee = await resolveFeeAmountCentsForMonth(query.month, query.year);
  if (monthlyFee === null) return { error: "NO_ACTIVE_FEE_STRUCTURE" as const };

  const students = await prisma.student.findMany({
    where: {
      current_medresa_id: medresaId,
      deleted_at: null,
      status: StudentStatus.ACTIVE,
    },
    select: {
      id: true,
      full_name: true,
      photo_url: true,
      enrolled_at: true,
    },
    orderBy: { full_name: "asc" },
  });

  const rows: FeeCollectionRowDto[] = [];
  for (const s of students) {
    const row = await computeCollectionRow(s, medresaId, query.month, query.year);
    if (row) rows.push(row);
  }

  const statusFilter = query.status ?? "ALL";
  const filtered =
    statusFilter === "ALL" ? rows : rows.filter((r) => r.status === statusFilter);

  const totalDue = rows.reduce((s, r) => s + r.amountDueEtb, 0);
  const totalCollected = rows.reduce((s, r) => s + r.amountPaidEtb, 0);
  const totalOutstanding = rows.reduce((s, r) => s + r.balanceEtb, 0);

  return {
    month: query.month,
    year: query.year,
    summary: {
      totalDueEtb: Math.round(totalDue * 100) / 100,
      totalCollectedEtb: Math.round(totalCollected * 100) / 100,
      totalOutstandingEtb: Math.round(totalOutstanding * 100) / 100,
      studentCount: rows.length,
    },
    items: filtered,
  };
};

export const getStudentFeeHistory = async (
  req: Request,
  medresaId: string,
  studentId: string
) => {
  if (!canReadFees(req, medresaId)) return { error: "FORBIDDEN" as const };
  if (!(await studentBelongsToMedresa(studentId, medresaId))) {
    return { error: "STUDENT_NOT_FOUND" as const };
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId },
    select: { id: true, full_name: true },
  });
  if (!student) return { error: "STUDENT_NOT_FOUND" as const };

  await recomputeFeeBalance(studentId, medresaId);
  const balance = await prisma.feeBalance.findUnique({
    where: { student_id_medresa_id: { student_id: studentId, medresa_id: medresaId } },
  });

  const payments = await prisma.feePayment.findMany({
    where: { student_id: studentId, medresa_id: medresaId, deleted_at: null },
    orderBy: [{ year: "desc" }, { month: "desc" }, { created_at: "desc" }],
  });

  return {
    studentId: student.id,
    fullName: student.full_name,
    totalDueEtb: balance ? centsToEtb(balance.total_due) : 0,
    totalPaidEtb: balance ? centsToEtb(balance.total_paid) : 0,
    outstandingBalanceEtb: balance ? centsToEtb(balance.outstanding_balance) : 0,
    payments: payments.map(mapFeePayment),
  };
};

export const getMedresaFeeOverview = async (
  req: Request,
  medresaId: string,
  query: FeeOverviewQuery
) => {
  if (!canReadFees(req, medresaId)) return { error: "FORBIDDEN" as const };

  const items = [];
  for (const { month, year } of iterateEthiopianMonths(
    { month: query.fromMonth, year: query.fromYear },
    { month: query.toMonth, year: query.toYear }
  )) {
    const coll = await getFeeCollection(req, medresaId, {
      month,
      year,
      status: "ALL",
    });
    if ("error" in coll) continue;
    const rate =
      coll.summary.totalDueEtb > 0
        ? Math.round((coll.summary.totalCollectedEtb / coll.summary.totalDueEtb) * 10000) / 100
        : null;
    items.push({
      month,
      year,
      studentCount: coll.summary.studentCount,
      totalDueEtb: coll.summary.totalDueEtb,
      totalCollectedEtb: coll.summary.totalCollectedEtb,
      totalOutstandingEtb: coll.summary.totalOutstandingEtb,
      collectionRatePercent: rate,
    });
  }

  return { medresaId, items };
};

export const getNetworkFeeOverview = async (req: Request, query: NetworkFeeOverviewQuery) => {
  if (!req.user!.isSuperAdmin) return { error: "FORBIDDEN" as const };

  const medresas = await prisma.medresa.findMany({
    where: {
      deleted_at: null,
      ...(query.medresaId ? { id: query.medresaId } : {}),
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const items = [];
  for (const m of medresas) {
    for (const { month, year } of iterateEthiopianMonths(
      { month: query.fromMonth, year: query.fromYear },
      { month: query.toMonth, year: query.toYear }
    )) {
      const coll = await getFeeCollection(req, m.id, { month, year, status: "ALL" });
      if ("error" in coll) continue;
      const rate =
        coll.summary.totalDueEtb > 0
          ? Math.round((coll.summary.totalCollectedEtb / coll.summary.totalDueEtb) * 10000) / 100
          : null;
      items.push({
        medresaId: m.id,
        medresaName: m.name,
        month,
        year,
        totalDueEtb: coll.summary.totalDueEtb,
        totalCollectedEtb: coll.summary.totalCollectedEtb,
        totalOutstandingEtb: coll.summary.totalOutstandingEtb,
        collectionRatePercent: rate,
      });
    }
  }

  return { items };
};

/** Current-month fee status for student detail card. */
export const getStudentFeeStatusSummary = async (studentId: string, medresaId: string) => {
  const today = getEthiopianToday();
  const student = await prisma.student.findFirst({
    where: { id: studentId, current_medresa_id: medresaId, deleted_at: null },
    select: { id: true, full_name: true, photo_url: true, enrolled_at: true },
  });
  if (!student) return null;
  const row = await computeCollectionRow(student, medresaId, today.month, today.year);
  if (!row) return null;
  return {
    status: row.status,
    outstandingBalanceEtb: row.balanceEtb,
    month: row.month,
    year: row.year,
  };
};
