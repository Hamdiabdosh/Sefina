import { AuditAction, Status } from "../../../prisma/generated/prisma/enums";
import { auditLog } from "../../lib/audit";
import { prisma } from "../../lib/prisma";
import type { CreateExamTypeInput, ListExamTypesQuery, UpdateExamTypeInput } from "./grade.schema";
import { mapExamType } from "./grade.mapper";

const activeWhere = { deleted_at: null } as const;

const computeActiveWeightSum = async (
  candidate?: { id?: string; weight: number; status: Status }
): Promise<number> => {
  const rows = await prisma.examType.findMany({
    where: { ...activeWhere, status: Status.ACTIVE },
    select: { id: true, weight: true },
  });
  let sum = 0;
  for (const r of rows) {
    if (candidate?.id && r.id === candidate.id) {
      if (candidate.status === Status.ACTIVE) sum += candidate.weight;
      continue;
    }
    sum += r.weight;
  }
  if (!candidate?.id && candidate?.status === Status.ACTIVE) {
    sum += candidate.weight;
  }
  return sum;
};

const validateWeightSum = async (
  candidate: { id?: string; weight: number; status: Status }
): Promise<{ ok: true } | { error: "WEIGHT_SUM_INVALID" }> => {
  if (candidate.status !== Status.ACTIVE) return { ok: true };
  const sum = await computeActiveWeightSum(candidate);
  if (sum !== 100) return { error: "WEIGHT_SUM_INVALID" };
  return { ok: true };
};

export const listExamTypes = async (query: ListExamTypesQuery) => {
  const items = await prisma.examType.findMany({
    where: {
      ...activeWhere,
      ...(query.status ? { status: query.status } : {}),
    },
    orderBy: { created_at: "asc" },
  });
  return { items: items.map(mapExamType) };
};

export const createExamType = async (input: CreateExamTypeInput, performedBy: string) => {
  const status = (input.status ?? "ACTIVE") as Status;
  const weightCheck = await validateWeightSum({
    weight: input.weight,
    status,
  });
  if ("error" in weightCheck) return weightCheck;

  const row = await prisma.examType.create({
    data: {
      name: input.name,
      max_score: input.maxScore,
      weight: input.weight,
      status,
    },
  });

  await auditLog({
    tableName: "ExamType",
    recordId: row.id,
    action: AuditAction.INSERT,
    performedBy,
    newValues: { max_score: row.max_score, weight: row.weight, status: row.status },
  });

  return { examType: mapExamType(row) };
};

export const updateExamType = async (
  id: string,
  input: UpdateExamTypeInput,
  performedBy: string
) => {
  const existing = await prisma.examType.findFirst({
    where: { id, ...activeWhere },
  });
  if (!existing) return { error: "EXAM_TYPE_NOT_FOUND" as const };

  const nextStatus = (input.status ?? existing.status) as Status;
  const nextWeight = input.weight ?? existing.weight;
  const weightCheck = await validateWeightSum({
    id,
    weight: nextWeight,
    status: nextStatus,
  });
  if ("error" in weightCheck) return weightCheck;

  const row = await prisma.examType.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.maxScore !== undefined ? { max_score: input.maxScore } : {}),
      ...(input.weight !== undefined ? { weight: input.weight } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
  });

  await auditLog({
    tableName: "ExamType",
    recordId: row.id,
    action: AuditAction.UPDATE,
    performedBy,
    oldValues: {
      max_score: existing.max_score,
      weight: existing.weight,
      status: existing.status,
    },
    newValues: { max_score: row.max_score, weight: row.weight, status: row.status },
  });

  return { examType: mapExamType(row) };
};

export const getExamTypeById = async (id: string) => {
  const row = await prisma.examType.findFirst({
    where: { id, ...activeWhere },
  });
  return row ? mapExamType(row) : null;
};
