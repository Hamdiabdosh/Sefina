import type { Request } from "express";
import { Status } from "../../../prisma/generated/prisma/enums";
import { auditLog, getClientIp } from "../../lib/audit";
import { endOfEthiopianMonth } from "../../lib/ethiopian-calendar";
import { prismaDateFromCalendarYmd } from "../../lib/ethiopia-time";
import { prisma } from "../../lib/prisma";
import type { CreateFeeStructureInput } from "./fee.schema";
import { etbToCents, mapFeeStructure } from "./fee.mapper";

export const listFeeStructures = async () => {
  const rows = await prisma.feeStructure.findMany({
    where: { deleted_at: null },
    orderBy: { effective_from: "desc" },
  });
  return { items: rows.map(mapFeeStructure) };
};

export const getActiveFeeStructure = async () => {
  const row = await prisma.feeStructure.findFirst({
    where: { deleted_at: null, status: Status.ACTIVE },
    orderBy: { effective_from: "desc" },
  });
  if (!row) return { error: "NO_ACTIVE_FEE_STRUCTURE" as const };
  return { structure: mapFeeStructure(row), row };
};

/** Fee amount in cents effective for Ethiopian month/year (BR-02). */
export const resolveFeeAmountCentsForMonth = async (
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

export const createFeeStructure = async (
  userId: string,
  input: CreateFeeStructureInput,
  req: Request
) => {
  const effectiveFrom = prismaDateFromCalendarYmd(input.effectiveFrom);
  const monthlyAmount = etbToCents(input.monthlyAmountEtb);

  const row = await prisma.$transaction(async (tx) => {
    await tx.feeStructure.updateMany({
      where: { deleted_at: null, status: Status.ACTIVE },
      data: { status: Status.INACTIVE },
    });
    return tx.feeStructure.create({
      data: {
        monthly_amount: monthlyAmount,
        effective_from: effectiveFrom,
        status: Status.ACTIVE,
        created_by: userId,
      },
    });
  });

  await auditLog({
    tableName: "FeeStructure",
    recordId: row.id,
    action: "INSERT",
    performedBy: userId,
    newValues: { monthly_amount: monthlyAmount, effective_from: input.effectiveFrom },
    ip: getClientIp(req),
  });

  return { structure: mapFeeStructure(row) };
};
