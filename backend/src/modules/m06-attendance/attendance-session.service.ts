import type { Request } from "express";
import { AuditAction, AttendanceStatus, Status, StudentStatus } from "../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { auditLog, getClientIp } from "../../lib/audit";
import { assertMedresaActive } from "../../lib/medresa-scope";
import { teacherCanAccessMedresaCourse } from "../m04-course/course-assignment.service";
import { teacherCanAccessStudent } from "../../lib/student-scope";
import { getActiveTeacherIdForUser } from "../../lib/attendance-scope";
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
  medresa_course: {
    select: {
      id: true,
      medresa_id: true,
      course: { select: { name: true } },
    },
  },
} as const;

function mapSessionDetail(
  session: {
    id: string;
    medresa_course_id: string;
    date: Date;
    submitted_at: Date | null;
    is_locked: boolean;
  },
  medresaId: string,
  records: ReturnType<typeof mapRecord>[]
): AttendanceSessionDetailDTO {
  return {
    id: session.id,
    medresaCourseId: session.medresa_course_id,
    medresaId,
    date: dateToCalendarEt(session.date),
    submittedAt: session.submitted_at ? session.submitted_at.toISOString() : null,
    isLocked: session.is_locked,
    records,
  };
}

export async function createAttendanceSession(
  userId: string,
  input: CreateAttendanceSessionInput,
  req?: Request
) {
  const date = parseCalendarYmd(input.date);
  if (!date) return { error: "ATTENDANCE_INVALID_DATE" as const };

  const teacherId = await getActiveTeacherIdForUser(userId);
  if (!teacherId) return { error: "FORBIDDEN" as const };

  const mc = await prisma.medresaCourse.findFirst({
    where: {
      id: input.medresaCourseId,
      deleted_at: null,
      status: Status.ACTIVE,
    },
    select: { id: true, medresa_id: true },
  });
  if (!mc) return { error: "MEDRESA_COURSE_NOT_FOUND" as const };

  const active = await assertMedresaActive(mc.medresa_id);
  if (!active) return { error: "MEDRESA_INACTIVE" as const };

  const okAccess = await teacherCanAccessMedresaCourse(userId, mc.id, mc.medresa_id);
  if (!okAccess) return { error: "FORBIDDEN" as const };

  const todayEt = getCalendarDateEt();
  if (date > todayEt) return { error: "ATTENDANCE_FUTURE_DATE" as const };

  const prismaDate = prismaDateFromCalendarYmd(date);

  const existing = await prisma.attendanceSession.findFirst({
    where: {
      medresa_course_id: mc.id,
      date: prismaDate,
      deleted_at: null,
    },
    select: { id: true },
  });
  if (existing) return { error: "ATTENDANCE_DUPLICATE_SESSION" as const };

  const roster = await prisma.studentCourse.findMany({
    where: {
      medresa_course_id: mc.id,
      deleted_at: null,
      student: { deleted_at: null, status: StudentStatus.ACTIVE },
    },
    select: { student_id: true },
    orderBy: { student_id: "asc" },
  });
  if (roster.length === 0) return { error: "ATTENDANCE_NO_ROSTER" as const };

  const rosterSet = new Set(roster.map((r) => r.student_id));

  const seenInPayload = new Set<string>();
  for (const r of input.records) {
    if (seenInPayload.has(r.studentId)) {
      return { error: "ATTENDANCE_DUPLICATE_STUDENT_PAYLOAD" as const };
    }
    seenInPayload.add(r.studentId);
    if (!rosterSet.has(r.studentId)) return { error: "ATTENDANCE_INVALID_STUDENT" as const };
  }

  const combined = roster.map(({ student_id: sid }) => {
    const fromPayload = input.records.find((rec) => rec.studentId === sid);
    return {
      student_id: sid,
      status: (fromPayload?.status ?? AttendanceStatus.ABSENT) as AttendanceStatus,
      note: fromPayload?.note ?? null,
    };
  });

  const session = await prisma.$transaction(async (tx) => {
    return tx.attendanceSession.create({
      data: {
        medresa_course_id: mc.id,
        teacher_id: teacherId,
        date: prismaDate,
        submitted_at: new Date(),
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
    newValues: { medresaCourseId: mc.id, date, teacherId },
    ip: req ? getClientIp(req) : null,
  });

  return {
    session: mapSessionDetail(
      session,
      session.medresa_course.medresa_id,
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
  const teacherId = await getActiveTeacherIdForUser(userId);
  if (!teacherId) return { error: "FORBIDDEN" as const };

  const session = await prisma.attendanceSession.findFirst({
    where: { id: sessionId, deleted_at: null },
    include: sessionInclude,
  });

  if (!session) return { error: "NOT_FOUND" as const };
  if (session.teacher_id !== teacherId) return { error: "FORBIDDEN" as const };

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

  for (const r of input.records) {
    const rec = byStudent.get(r.studentId)!;
    const nextStatus = r.status ?? rec.status;
    const nextNote = r.note !== undefined ? r.note : rec.note;

    const statusChanged = nextStatus !== rec.status;
    const noteChanged = (nextNote ?? null) !== (rec.note ?? null);
    if (!statusChanged && !noteChanged) continue;

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

  const fresh = await prisma.attendanceSession.findFirstOrThrow({
    where: { id: sessionId, deleted_at: null },
    include: sessionInclude,
  });

  return {
    session: mapSessionDetail(
      fresh,
      fresh.medresa_course.medresa_id,
      fresh.records.map(mapRecord)
    ),
  };
}

export async function listTeacherAttendanceSessions(
  userId: string,
  query: ListAttendanceSessionsQuery
): Promise<{ error: "FORBIDDEN" } | { items: SessionListItemDTO[] }> {
  const teacherId = await getActiveTeacherIdForUser(userId);
  if (!teacherId) return { error: "FORBIDDEN" as const };

  const fromParsed = query.from ? parseCalendarYmd(query.from) : undefined;
  const toParsed = query.to ? parseCalendarYmd(query.to) : undefined;
  if (query.from && !fromParsed) return { items: [] };
  if (query.to && !toParsed) return { items: [] };

  const from = fromParsed ? prismaDateFromCalendarYmd(fromParsed) : undefined;
  const to = toParsed ? prismaDateFromCalendarYmd(toParsed) : undefined;

  const dateFilter =
    from && to ? { gte: from, lte: to } : from ? { gte: from } : to ? { lte: to } : undefined;

  const rows = await prisma.attendanceSession.findMany({
    where: {
      teacher_id: teacherId,
      deleted_at: null,
      ...(query.medresaCourseId ? { medresa_course_id: query.medresaCourseId } : {}),
      ...(dateFilter ? { date: dateFilter } : {}),
    },
    orderBy: [{ date: "desc" }, { id: "desc" }],
    include: {
      records: { where: { deleted_at: null } },
      medresa_course: { select: { medresa_id: true } },
    },
  });

  const items: SessionListItemDTO[] = rows.map((s) => {
    const statuses = s.records.map((rec) => rec.status);
    return {
      id: s.id,
      medresaCourseId: s.medresa_course_id,
      medresaId: s.medresa_course.medresa_id,
      date: dateToCalendarEt(s.date),
      submittedAt: s.submitted_at ? s.submitted_at.toISOString() : null,
      isLocked: s.is_locked,
      counts: countStatuses(statuses),
      totalStudents: s.records.length,
    };
  });

  return { items };
}

export async function getTeacherStudentAttendance(
  userId: string,
  studentId: string
): Promise<
  { error: "FORBIDDEN" } | { error: "NOT_FOUND" } | { data: StudentAttendanceSummaryDTO }
> {
  const ok = await teacherCanAccessStudent(userId, studentId);
  if (!ok) return { error: "FORBIDDEN" as const };

  const teacherId = await getActiveTeacherIdForUser(userId);
  if (!teacherId) return { error: "FORBIDDEN" as const };

  const student = await prisma.student.findFirst({
    where: { id: studentId, deleted_at: null },
    select: { id: true },
  });
  if (!student) return { error: "NOT_FOUND" as const };

  const rows = await prisma.attendanceRecord.findMany({
    where: {
      student_id: studentId,
      deleted_at: null,
      session: {
        deleted_at: null,
        teacher_id: teacherId,
      },
    },
    orderBy: { session: { date: "desc" } },
    include: {
      session: {
        select: {
          date: true,
          medresa_course_id: true,
          medresa_course: {
            select: {
              course: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const entries = rows.map((r) => {
    const nameJson = r.session.medresa_course.course.name as { en?: string };
    return {
      date: dateToCalendarEt(r.session.date),
      medresaCourseId: r.session.medresa_course_id,
      courseNameEn: nameJson?.en ?? "",
      status: r.status,
      note: r.note,
    };
  });

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
