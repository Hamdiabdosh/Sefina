import type { Request } from "express";
import { AuditAction } from "../../../prisma/generated/prisma/enums";
import { auditLog, getClientIp } from "../../lib/audit";
import { isFuturePaymentDate, parsePaymentDateYmd } from "../../lib/ethiopian-calendar";
import {
  assertMedresaActive,
  canRecordFeePayment,
  canVoidFeePayment,
  studentBelongsToMedresa,
} from "../../lib/fee-scope";
import { prisma } from "../../lib/prisma";
import type { RecordFeePaymentInput, VoidFeePaymentInput } from "./fee.schema";
import { etbToCents, mapFeePayment } from "./fee.mapper";
import { computeCollectionRow, recomputeFeeBalance } from "./fee-ledger.service";
import { getActiveFeeStructure, resolveFeeAmountCentsForMonth } from "./fee-structure.service";

export const recordFeePayment = async (
  userId: string,
  input: RecordFeePaymentInput,
  req: Request
) => {
  if (!canRecordFeePayment(req, input.medresaId)) return { error: "FORBIDDEN" as const };
  if (!(await assertMedresaActive(input.medresaId))) return { error: "MEDRESA_INACTIVE" as const };
  if (!(await studentBelongsToMedresa(input.studentId, input.medresaId))) {
    return { error: "STUDENT_NOT_FOUND" as const };
  }

  const active = await getActiveFeeStructure();
  if ("error" in active) return { error: active.error };

  const monthlyFee = await resolveFeeAmountCentsForMonth(input.month, input.year);
  if (monthlyFee === null) return { error: "NO_ACTIVE_FEE_STRUCTURE" as const };

  const paymentDate = parsePaymentDateYmd(input.paymentDate);
  if (!paymentDate) return { error: "INVALID_PAYMENT_DATE" as const };
  if (isFuturePaymentDate(paymentDate)) return { error: "PAYMENT_DATE_IN_FUTURE" as const };

  const amountPaid = etbToCents(input.amountPaidEtb);

  const student = await prisma.student.findFirst({
    where: { id: input.studentId },
    select: { id: true, full_name: true, photo_url: true, enrolled_at: true },
  });
  if (!student) return { error: "STUDENT_NOT_FOUND" as const };

  const row = await computeCollectionRow(
    student,
    input.medresaId,
    input.month,
    input.year
  );
  if (!row) return { error: "NO_ACTIVE_FEE_STRUCTURE" as const };

  const amountDue = etbToCents(row.amountDueEtb);

  const created = await prisma.feePayment.create({
    data: {
      student_id: input.studentId,
      medresa_id: input.medresaId,
      fee_structure_id: active.row.id,
      month: input.month,
      year: input.year,
      amount_due: amountDue,
      amount_paid: amountPaid,
      payment_method: input.paymentMethod,
      bank_reference:
        input.paymentMethod === "BANK_TRANSFER" ? input.bankReference?.trim() ?? null : null,
      payment_date: paymentDate,
      note: input.note?.trim() ?? null,
      recorded_by: userId,
    },
  });

  await recomputeFeeBalance(input.studentId, input.medresaId);

  await auditLog({
    tableName: "FeePayment",
    recordId: created.id,
    action: AuditAction.INSERT,
    performedBy: userId,
    newValues: { amount_paid: amountPaid, month: input.month, year: input.year },
    ip: getClientIp(req),
  });

  return { payment: mapFeePayment(created) };
};

export const voidFeePayment = async (
  userId: string,
  paymentId: string,
  input: VoidFeePaymentInput,
  req: Request
) => {
  if (!canVoidFeePayment(req)) return { error: "FORBIDDEN" as const };

  const existing = await prisma.feePayment.findFirst({
    where: { id: paymentId, deleted_at: null },
  });
  if (!existing) return { error: "PAYMENT_NOT_FOUND" as const };

  await prisma.feePayment.update({
    where: { id: paymentId },
    data: { deleted_at: new Date() },
  });

  await recomputeFeeBalance(existing.student_id, existing.medresa_id);

  await auditLog({
    tableName: "FeePayment",
    recordId: paymentId,
    action: AuditAction.SOFT_DELETE,
    performedBy: userId,
    oldValues: { amount_paid: existing.amount_paid },
    newValues: { reason: input.reason },
    ip: getClientIp(req),
  });

  return { ok: true };
};
