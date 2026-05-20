import type { Request } from "express";
import { Status } from "../../../prisma/generated/prisma/enums";
import { AuditAction } from "../../../prisma/generated/prisma/enums";
import { auditLog, getClientIp } from "../../lib/audit";
import { prismaDateFromCalendarYmd } from "../../lib/ethiopia-time";
import { prisma } from "../../lib/prisma";
import type { CreateSalaryRankInput, PatchSalaryRankInput } from "./salary.schema";
import { etbToCents, mapSalaryRank } from "./salary.mapper";
import { countTeachersOnRank } from "./salary-teacher-rank.service";

export const listSalaryRanks = async () => {
  const rows = await prisma.salaryRank.findMany({
    where: { deleted_at: null, status: Status.ACTIVE },
    orderBy: { monthly_amount: "asc" },
  });
  const items = await Promise.all(
    rows.map(async (row) => ({
      ...mapSalaryRank(row),
      teacherCount: await countTeachersOnRank(row.id),
    }))
  );
  return { items };
};

export const listSalaryRankHistory = async () => {
  const rows = await prisma.salaryRank.findMany({
    where: { deleted_at: null },
    orderBy: { effective_from: "desc" },
  });
  return { items: rows.map(mapSalaryRank) };
};

export const createSalaryRank = async (
  userId: string,
  input: CreateSalaryRankInput,
  req: Request
) => {
  const effectiveFrom = prismaDateFromCalendarYmd(input.effectiveFrom);
  const monthlyAmount = etbToCents(input.monthlyAmountEtb);

  const row = await prisma.salaryRank.create({
    data: {
      name: input.name,
      monthly_amount: monthlyAmount,
      effective_from: effectiveFrom,
      status: Status.ACTIVE,
    },
  });

  await auditLog({
    tableName: "SalaryRank",
    recordId: row.id,
    action: AuditAction.INSERT,
    performedBy: userId,
    newValues: { monthly_amount: monthlyAmount, effective_from: input.effectiveFrom },
    ip: getClientIp(req),
  });

  return { rank: mapSalaryRank(row) };
};

export const patchSalaryRank = async (
  userId: string,
  rankId: string,
  input: PatchSalaryRankInput,
  req: Request
) => {
  const existing = await prisma.salaryRank.findFirst({
    where: { id: rankId, deleted_at: null },
  });
  if (!existing) return { error: "SALARY_RANK_NOT_FOUND" as const };

  const amountChange =
    input.monthlyAmountEtb !== undefined &&
    etbToCents(input.monthlyAmountEtb) !== existing.monthly_amount;
  const effectiveChange =
    input.effectiveFrom !== undefined &&
    input.effectiveFrom !== existing.effective_from.toISOString().slice(0, 10);

  if (amountChange || effectiveChange) {
    const newEffectiveFrom = input.effectiveFrom
      ? prismaDateFromCalendarYmd(input.effectiveFrom)
      : existing.effective_from;
    const newAmount =
      input.monthlyAmountEtb !== undefined
        ? etbToCents(input.monthlyAmountEtb)
        : existing.monthly_amount;
    const newName = input.name ?? (existing.name as Record<string, string>);

    const result = await prisma.$transaction(async (tx) => {
      await tx.salaryRank.update({
        where: { id: rankId },
        data: { status: Status.INACTIVE },
      });
      const created = await tx.salaryRank.create({
        data: {
          name: newName,
          monthly_amount: newAmount,
          effective_from: newEffectiveFrom,
          status: Status.ACTIVE,
        },
      });
      return created;
    });

    await auditLog({
      tableName: "SalaryRank",
      recordId: rankId,
      action: AuditAction.UPDATE,
      performedBy: userId,
      oldValues: { status: Status.ACTIVE },
      newValues: { status: Status.INACTIVE, superseded_by: result.id },
      ip: getClientIp(req),
    });
    await auditLog({
      tableName: "SalaryRank",
      recordId: result.id,
      action: AuditAction.INSERT,
      performedBy: userId,
      newValues: { monthly_amount: newAmount, effective_from: input.effectiveFrom ?? existing.effective_from.toISOString().slice(0, 10) },
      ip: getClientIp(req),
    });

    return { rank: mapSalaryRank(result) };
  }

  const updated = await prisma.salaryRank.update({
    where: { id: rankId },
    data: {
      ...(input.name ? { name: input.name } : {}),
    },
  });

  await auditLog({
    tableName: "SalaryRank",
    recordId: rankId,
    action: AuditAction.UPDATE,
    performedBy: userId,
    newValues: input.name ? { name: input.name } : {},
    ip: getClientIp(req),
  });

  return { rank: mapSalaryRank(updated) };
};

export const deactivateSalaryRank = async (userId: string, rankId: string, req: Request) => {
  const existing = await prisma.salaryRank.findFirst({
    where: { id: rankId, deleted_at: null, status: Status.ACTIVE },
  });
  if (!existing) return { error: "SALARY_RANK_NOT_FOUND" as const };

  await prisma.salaryRank.update({
    where: { id: rankId },
    data: { status: Status.INACTIVE },
  });

  await auditLog({
    tableName: "SalaryRank",
    recordId: rankId,
    action: AuditAction.UPDATE,
    performedBy: userId,
    oldValues: { status: Status.ACTIVE },
    newValues: { status: Status.INACTIVE },
    ip: getClientIp(req),
  });

  return { ok: true };
};
