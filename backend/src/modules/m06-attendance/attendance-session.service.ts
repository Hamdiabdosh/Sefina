import type { Request } from "express";
import { AuditAction, AttendanceStatus, StudentStatus } from "../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { auditLog, getClientIp } from "../../lib/audit";
import { assertMedresaActive } from "../../lib/medresa-scope";
import { canReadStudent } from "../../lib/student-scope";
import {
  getActiveTeacherIdForUser,
  resolveAttendanceWriterKind,
  userCanWriteAttendanceForMedresa,
  listMedresaIdsForAttendanceWriter,
  loadActiveStudentIdsForMedresa,
} from "../../lib/attendance-scope";
import {
  dateToCalendarEt,
  getCalendarDateEt,
  parseCalendarYmd,
  prismaDateFromCalendarYmd,
} from "../../lib/ethiopia-time";
import type {
  CreateAttendanceSessionInput,
  ListAttendanceSessionsQuery,
  PatchAttendanceSessionInput,
} from "./attendance.schema";
import {
  countStatuses,
  mapRecord,
  type AttendanceSessionDetailDTO,
  type SessionListItemDTO,
  type StudentAttendanceSummaryDTO,
} from "./attendance.mapper";

const sessionInclude = {
  records: {
    where: { deleted_at: null },
    orderBy: { student_id: "asc" as const },
  },
  medresa: {
    select: { id: true },
  },
} as const;

function mapSessionDetail(
  session: {
    id: string;
    medresa_id: string;
    date: Date;
    submitted_at: Date | null;
    is_locked: boolean;
    teacher_marked_at: Date | null;
    admin_marked_at: Date | null;
  },
  records: ReturnType<typeof mapRecord>[]
): AttendanceSessionDetailDTO {
  return {
    id: session.id,
    medresaId: session.medresa_id,
    date: dateToCalendarEt(session.date),
    submittedAt: session.submitted_at ? session.submitted_at.toISOString() : null,
    teacherMarkedAt: session.teacher_marked_at ? session.teacher_marked_at.toISOString() : null,
    adminMarkedAt: session.admin_marked_at ? session.admin_marked_at.toISOString() : null,
    isLocked: session.is_locked,
    records,
  };
}

export async function listAttendanceRoster(
  userId: string,
  medresaId: string
): Promise<
  | { error: "FORBIDDEN" }
  | { error: "MEDRESA_INACTIVE" }
  | { items: { id: string; fullName: string }[] }
> {
  const ok = await userCanWriteAttendanceForMedresa(userId, medresaId);
  if (!ok) return { error: "FORBIDDEN" as const };

  const active = await assertMedresaActive(medresaId);
  if (!active) return { error: "MEDRESA_INACTIVE" as const };

  const students = await prisma.student.findMany({
    where: {
      current_medresa_id: medresaId,
      deleted_at: null,
      status: StudentStatus.ACTIVE,
    },
    select: { id: true, full_name: true },
    orderBy: { full_name: "asc" },
  });

  return {
    items: students.map((s) => ({ id: s.id, fullName: s.full_name })),
  };
}

export async function createAttendanceSession(
  userId: string,
  input: CreateAttendanceSessionInput,
  req?: Request
) {
  const date = parseCalendarYmd(input.date);
  if (!date) return { error: "ATTENDANCE_INVALID_DATE" as const };

  const writerKind = await resolveAttendanceWriterKind(userId, input.medresaId);
  if (!writerKind) return { error: "FORBIDDEN" as const };

  const active = await assertMedresaActive(input.medresaId);
  if (!active) return { error: "MEDRESA_INACTIVE" as const };

  const todayEt = getCalendarDateEt();
  if (date > todayEt) return { error: "ATTENDANCE_FUTURE_DATE" as const };

  const prismaDate = prismaDateFromCalendarYmd(date);

  const existing = await prisma.attendanceSession.findFirst({
    where: {
      medresa_id: input.medresaId,
      date: prismaDate,
      deleted_at: null,
    },
    select: { id: true },
  });
  if (existing) return { error: "ATTENDANCE_DUPLICATE_SESSION" as const };

  const rosterIds = await loadActiveStudentIdsForMedresa(input.medresaId);
  const rosterSet = new Set(rosterIds);
  if (rosterIds.length === 0) return { error: "ATTENDANCE_NO_ROSTER" as const };

  const seenInPayload = new Set<string>();
  for (const r of input.records) {
    if (seenInPayload.has(r.studentId)) {
      return { error: "ATTENDANCE_DUPLICATE_STUDENT_PAYLOAD" as const };
    }
    seenInPayload.add(r.studentId);
    if (!rosterSet.has(r.studentId)) return { error: "ATTENDANCE_INVALID_STUDENT" as const };
  }

  const combined = rosterIds.map((sid) => {
    const fromPayload = input.records.find((rec) => rec.studentId === sid);
    return {
      student_id: sid,
      status: (fromPayload?.status ?? AttendanceStatus.ABSENT) as AttendanceStatus,
      note: fromPayload?.note ?? null,
    };
  });

  const teacherId =
    writerKind === "TEACHER" ? await getActiveTeacherIdForUser(userId) : null;
  if (writerKind === "TEACHER" && !teacherId) return { error: "FORBIDDEN" as const };
  const now = new Date();
  const session = await prisma.$transaction(async (tx) => {
    return tx.attendanceSession.create({
      data: {
        medresa_id: input.medresaId,
        date: prismaDate,
        submitted_at: now,
        ...(writerKind === "TEACHER"
          ? {
              teacher_id: teacherId!,
              teacher_marked_at: now,
            }
          : {
              admin_marked_at: now,
            }),
        records: {
          create: combined.map((c) => ({
            student_id: c.student_id,
            status: c.status,
            note: c.note ?? undefined,
          })),
        },
      },
      include: sessionInclude,
    });
  });

  await auditLog({
    tableName: "AttendanceSession",
    recordId: session.id,
    action: AuditAction.INSERT,
    performedBy: userId,
    newValues: {
      medresaId: input.medresaId,
      date,
      writerKind,
      teacherId: teacherId ?? null,
    },
    ip: req ? getClientIp(req) : null,
  });

  return {
    session: mapSessionDetail(
      session,
      session.records.map(mapRecord)
    ),
  };
}

export async function patchAttendanceSession(
  userId: string,
  sessionId: string,
  input: PatchAttendanceSessionInput,
  req?: Request
) {
  const session = await prisma.attendanceSession.findFirst({
    where: { id: sessionId, deleted_at: null },
    include: sessionInclude,
  });

  if (!session) return { error: "NOT_FOUND" as const };

  const writerKind = await resolveAttendanceWriterKind(userId, session.medresa_id);
  if (!writerKind) return { error: "FORBIDDEN" as const };

  const sessionCal = dateToCalendarEt(session.date);
  const today = getCalendarDateEt();
  if (session.is_locked || sessionCal !== today) {
    return { error: "ATTENDANCE_LOCKED" as const };
  }

  const seen = new Set<string>();
  for (const r of input.records) {
    if (seen.has(r.studentId)) return { error: "ATTENDANCE_DUPLICATE_STUDENT_PAYLOAD" as const };
    seen.add(r.studentId);
  }

  const byStudent = new Map(session.records.map((rec) => [rec.student_id, rec]));

  for (const r of input.records) {
    if (!byStudent.has(r.studentId)) return { error: "ATTENDANCE_INVALID_STUDENT" as const };
  }

  let anyUpdated = false;

  for (const r of input.records) {
    const rec = byStudent.get(r.studentId)!;
    const nextStatus = r.status ?? rec.status;
    const nextNote = r.note !== undefined ? r.note : rec.note;

    const statusChanged = nextStatus !== rec.status;
    const noteChanged = (nextNote ?? null) !== (rec.note ?? null);
    if (!statusChanged && !noteChanged) continue;

    anyUpdated = true;

    await prisma.attendanceRecord.update({
      where: { id: rec.id },
      data: {
        status: nextStatus,
        note: nextNote ?? null,
        edited_at: new Date(),
      },
    });

    await auditLog({
      tableName: "AttendanceRecord",
      recordId: rec.id,
      action: AuditAction.UPDATE,
      performedBy: userId,
      oldValues: { status: rec.status, note: rec.note },
      newValues: { status: nextStatus, note: nextNote ?? null },
      ip: req ? getClientIp(req) : null,
    });
  }

  const stamp = new Date();
  if (anyUpdated) {
    await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        ...(writerKind === "TEACHER"
          ? { teacher_marked_at: stamp }
          : { admin_marked_at: stamp }),
      },
    });
  }

  const fresh = await prisma.attendanceSession.findFirstOrThrow({
    where: { id: sessionId, deleted_at: null },
    include: sessionInclude,
  });

  return {
    session: mapSessionDetail(
      fresh,
      fresh.records.map(mapRecord)
    ),
  };
}

export async function listWriterAttendanceSessions(
  userId: string,
  query: ListAttendanceSessionsQuery
): Promise<{ error: "FORBIDDEN" } | { items: SessionListItemDTO[] }> {
  const allowed = await listMedresaIdsForAttendanceWriter(userId);
  if (allowed.length === 0) return { error: "FORBIDDEN" as const };

  const fromParsed = query.from ? parseCalendarYmd(query.from) : undefined;
  const toParsed = query.to ? parseCalendarYmd(query.to) : undefined;
  if (query.from && !fromParsed) return { items: [] };
  if (query.to && !toParsed) return { items: [] };

  const from = fromParsed ? prismaDateFromCalendarYmd(fromParsed) : undefined;
  const to = toParsed ? prismaDateFromCalendarYmd(toParsed) : undefined;

  const dateFilter =
    from && to ? { gte: from, lte: to } : from ? { gte: from } : to ? { lte: to } : undefined;

  let medresaFilter = allowed;
  if (query.medresaId) {
    if (!allowed.includes(query.medresaId)) return { error: "FORBIDDEN" as const };
    medresaFilter = [query.medresaId];
  }

  const rows = await prisma.attendanceSession.findMany({
    where: {
      deleted_at: null,
      medresa_id: { in: medresaFilter },
      ...(dateFilter ? { date: dateFilter } : {}),
    },
    orderBy: [{ date: "desc" }, { id: "desc" }],
    include: {
      records: { where: { deleted_at: null } },
    },
  });

  const items: SessionListItemDTO[] = rows.map((s) => {
    const statuses = s.records.map((rec) => rec.status);
    return {
      id: s.id,
      medresaId: s.medresa_id,
      date: dateToCalendarEt(s.date),
      submittedAt: s.submitted_at ? s.submitted_at.toISOString() : null,
      teacherMarkedAt: s.teacher_marked_at ? s.teacher_marked_at.toISOString() : null,
      adminMarkedAt: s.admin_marked_at ? s.admin_marked_at.toISOString() : null,
      isLocked: s.is_locked,
      counts: countStatuses(statuses),
      totalStudents: s.records.length,
    };
  });

  return { items };
}

export async function getViewerStudentAttendance(
  req: Request,
  studentId: string
): Promise<
  { error: "FORBIDDEN" } | { error: "NOT_FOUND" } | { data: StudentAttendanceSummaryDTO }
> {
  const student = await prisma.student.findFirst({
    where: { id: studentId, deleted_at: null },
    select: { id: true, current_medresa_id: true },
  });
  if (!student) return { error: "NOT_FOUND" as const };

  const canRead = await canReadStudent(req, student);
  if (!canRead) return { error: "FORBIDDEN" as const };

  const rows = await prisma.attendanceRecord.findMany({
    where: {
      student_id: studentId,
      deleted_at: null,
      session: {
        deleted_at: null,
      },
    },
    orderBy: { session: { date: "desc" } },
    include: {
      session: {
        select: {
          date: true,
          medresa_id: true,
          medresa: { select: { name: true } },
        },
      },
    },
  });

  const entries = rows.map((r) => ({
    date: dateToCalendarEt(r.session.date),
    medresaId: r.session.medresa_id,
    medresaName: r.session.medresa.name,
    status: r.status,
    note: r.note,
  }));

  const totalSessions = rows.length;
  let countedAsPresent = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;

  for (const r of rows) {
    switch (r.status) {
      case AttendanceStatus.PRESENT:
        countedAsPresent += 1;
        break;
      case AttendanceStatus.LATE:
        late += 1;
        countedAsPresent += 1;
        break;
      case AttendanceStatus.EXCUSED:
        excused += 1;
        countedAsPresent += 1;
        break;
      default:
        absent += 1;
    }
  }

  const attendanceRatePct =
    totalSessions === 0 ? 0 : Math.round((countedAsPresent / totalSessions) * 10000) / 100;

  return {
    data: {
      studentId,
      totalSessions,
      countedAsPresent,
      absent,
      late,
      excused,
      attendanceRatePct,
      entries,
    },
  };
}
