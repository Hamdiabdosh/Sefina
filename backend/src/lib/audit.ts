import type { Prisma } from "../../prisma/generated/prisma/client";
import type { Request } from "express";
import { AuditAction } from "../../prisma/generated/prisma/enums";
import { prisma } from "./prisma";

type AuditLogInput = {
  tableName: string;
  recordId: string;
  action: AuditAction;
  performedBy?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ip?: string | null;
};

export const auditLog = async (input: AuditLogInput): Promise<void> => {
  await prisma.auditLog.create({
    data: {
      table_name: input.tableName,
      record_id: input.recordId,
      action: input.action,
      performed_by: input.performedBy ?? null,
      old_values: (input.oldValues ?? undefined) as Prisma.InputJsonValue | undefined,
      new_values: (input.newValues ?? undefined) as Prisma.InputJsonValue | undefined,
      ip_address: input.ip ?? null,
    },
  });
};

export const getClientIp = (req: Request): string | undefined => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim();
  }
  return req.socket.remoteAddress ?? undefined;
};
