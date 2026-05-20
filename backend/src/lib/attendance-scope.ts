import { MedresaRole, Status, StudentStatus } from "../../prisma/generated/prisma/enums";
import { prisma } from "./prisma";

export const getActiveTeacherIdForUser = async (
  userId: string
): Promise<string | null> => {
  const row = await prisma.teacher.findFirst({
    where: { user_id: userId, deleted_at: null, status: Status.ACTIVE },
    select: { id: true },
  });
  return row?.id ?? null;
};

/** Teacher or ADMIN (Amir) membership at a medresa (active teacher profile). */
export type AttendanceWriterKind = "ADMIN" | "TEACHER";

export async function resolveAttendanceWriterKind(
  userId: string,
  medresaId: string
): Promise<AttendanceWriterKind | null> {
  const asAdmin = await prisma.teacherMedresa.findFirst({
    where: {
      medresa_id: medresaId,
      role: MedresaRole.ADMIN,
      deleted_at: null,
      teacher: {
        user_id: userId,
        deleted_at: null,
        status: Status.ACTIVE,
      },
    },
    select: { id: true },
  });
  if (asAdmin) return "ADMIN";

  const asTeacher = await prisma.teacherMedresa.findFirst({
    where: {
      medresa_id: medresaId,
      role: MedresaRole.TEACHER,
      deleted_at: null,
      teacher: {
        user_id: userId,
        deleted_at: null,
        status: Status.ACTIVE,
      },
    },
    select: { id: true },
  });
  if (asTeacher) return "TEACHER";

  return null;
}

export async function userCanWriteAttendanceForMedresa(
  userId: string,
  medresaId: string
): Promise<boolean> {
  const kind = await resolveAttendanceWriterKind(userId, medresaId);
  return kind !== null;
}

/** Medresa IDs where this user may create or edit daily attendance. */
export async function listMedresaIdsForAttendanceWriter(
  userId: string
): Promise<string[]> {
  const rows = await prisma.teacherMedresa.findMany({
    where: {
      deleted_at: null,
      role: { in: [MedresaRole.ADMIN, MedresaRole.TEACHER] },
      teacher: {
        user_id: userId,
        deleted_at: null,
        status: Status.ACTIVE,
      },
    },
    select: { medresa_id: true },
    distinct: ["medresa_id"],
  });
  return rows.map((r) => r.medresa_id);
}

export async function loadActiveStudentIdsForMedresa(medresaId: string): Promise<string[]> {
  const rows = await prisma.student.findMany({
    where: {
      current_medresa_id: medresaId,
      deleted_at: null,
      status: StudentStatus.ACTIVE,
    },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  return rows.map((r) => r.id);
}
