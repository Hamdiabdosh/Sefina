import type { Request } from "express";
import { Prisma } from "../../../prisma/generated/prisma/client";
import { Status } from "../../../prisma/generated/prisma/enums";
import { AuditAction } from "../../../prisma/generated/prisma/enums";
import { auditLog, getClientIp } from "../../lib/audit";
import { isFuturePaymentDate, parsePaymentDateYmd } from "../../lib/ethiopian-calendar";
import { prisma } from "../../lib/prisma";
import type { RecordSalaryPaymentInput } from "./salary.schema";
import { computeTeacherSalary } from "./salary-computation";
import { etbToCents, mapSalaryPayment } from "./salary.mapper";

export const recordSalaryPayment = async (
  userId: string,
  input: RecordSalaryPaymentInput,
  req: Request
) => {
  const teacher = await prisma.teacher.findFirst({
    where: { id: input.teacherId, deleted_at: null, status: Status.ACTIVE },
  });
  if (!teacher) return { error: "TEACHER_NOT_FOUND" as const };

  const computed = await computeTeacherSalary(input.teacherId, input.month, input.year);
  if (computed.amountEtb === 0) return { error: "TEACHER_HAS_NO_RANK" as const };

  const paymentDate = parsePaymentDateYmd(input.paymentDate);
  if (!paymentDate) return { error: "INVALID_PAYMENT_DATE" as const };
  if (isFuturePaymentDate(paymentDate)) return { error: "PAYMENT_DATE_IN_FUTURE" as const };

  const expectedAmountCents = etbToCents(computed.amountEtb);
  const amountPaidCents = etbToCents(input.amountPaidEtb);
  const isAdjusted = amountPaidCents !== expectedAmountCents;

  if (isAdjusted && !input.adjustmentReason?.trim()) {
    return { error: "ADJUSTMENT_REASON_REQUIRED" as const };
  }

  try {
    const created = await prisma.salaryPayment.create({
      data: {
        teacher_id: input.teacherId,
        salary_rank_id: computed.rankId ?? undefined,
        month: input.month,
        year: input.year,
        amount_paid: amountPaidCents,
        bank_reference: input.bankReference.trim(),
        payment_date: paymentDate,
        note: input.note?.trim() ?? null,
        is_adjusted: isAdjusted,
        adjustment_reason: isAdjusted ? input.adjustmentReason?.trim() ?? null : null,
        recorded_by: userId,
      },
    });

    await auditLog({
      tableName: "SalaryPayment",
      recordId: created.id,
      action: AuditAction.INSERT,
      performedBy: userId,
      newValues: {
        amount_paid: amountPaidCents,
        month: input.month,
        year: input.year,
        is_adjusted: isAdjusted,
      },
      ip: getClientIp(req),
    });

    return { payment: mapSalaryPayment(created) };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "DUPLICATE_PAYMENT" as const };
    }
    throw e;
  }
};
