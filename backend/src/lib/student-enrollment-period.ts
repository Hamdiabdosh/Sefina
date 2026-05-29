import { EnrollmentEndReason } from "../../prisma/generated/prisma/enums";
import { prisma } from "./prisma";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export const openEnrollmentPeriod = async (
  tx: Tx,
  studentId: string,
  medresaId: string,
  startedAt: Date = new Date()
) => {
  await tx.$executeRaw`
    INSERT INTO "StudentEnrollmentPeriod" (id, student_id, medresa_id, started_at, end_reason, created_at, updated_at)
    VALUES (gen_random_uuid(), ${studentId}::uuid, ${medresaId}::uuid, ${startedAt}, ${EnrollmentEndReason.ENROLLED}::"EnrollmentEndReason", NOW(), NOW())
  `;
};

export const closeOpenEnrollmentPeriod = async (
  tx: Tx,
  studentId: string,
  medresaId: string,
  endReason: EnrollmentEndReason,
  endedAt: Date = new Date()
) => {
  await tx.$executeRaw`
    UPDATE "StudentEnrollmentPeriod"
    SET ended_at = ${endedAt}, end_reason = ${endReason}::"EnrollmentEndReason", updated_at = NOW()
    WHERE student_id = ${studentId}::uuid
      AND medresa_id = ${medresaId}::uuid
      AND ended_at IS NULL
  `;
};
