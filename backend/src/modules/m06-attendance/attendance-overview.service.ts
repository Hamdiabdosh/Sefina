import { prisma } from "../../lib/prisma";
import { assertMedresaActive } from "../../lib/medresa-scope";
import {
  dateToCalendarEt,
  parseCalendarYmd,
  prismaDateFromCalendarYmd,
} from "../../lib/ethiopia-time";
import { countStatuses } from "./attendance.mapper";
import type { MedresaAttendanceOverviewQuery, NetworkAttendanceOverviewQuery } from "./attendance.schema";

export async function getMedresaAttendanceOverview(
  medresaId: string,
  query: MedresaAttendanceOverviewQuery
) {
  const date = parseCalendarYmd(query.date);
  if (!date) return { error: "ATTENDANCE_INVALID_DATE" as const };

  const active = await assertMedresaActive(medresaId);
  if (!active) return { error: "MEDRESA_INACTIVE" as const };

  const prismaDate = prismaDateFromCalendarYmd(date);

  const rows = await prisma.attendanceSession.findMany({
    where: {
      deleted_at: null,
      date: prismaDate,
      medresa_course: {
        medresa_id: medresaId,
        deleted_at: null,
        ...(query.medresaCourseId ? { id: query.medresaCourseId } : {}),
        ...(query.teacherId
          ? {
              assignments: {
                some: { teacher_id: query.teacherId, deleted_at: null },
              },
            }
          : {}),
      },
    },
    include: {
      records: { where: { deleted_at: null } },
      teacher: { select: { id: true, full_name: true } },
      medresa_course: {
        select: {
          id: true,
          course: { select: { name: true } },
        },
      },
    },
    orderBy: [{ medresa_course_id: "asc" }],
  });

  const items = rows.map((s) => {
    const counts = countStatuses(s.records.map((r) => r.status));
    const nameJson = s.medresa_course.course.name as { en?: string };
    return {
      sessionId: s.id,
      medresaCourseId: s.medresa_course_id,
      courseNameEn: nameJson?.en ?? "",
      teacherId: s.teacher_id,
      teacherName: s.teacher.full_name,
      present: counts.PRESENT,
      absent: counts.ABSENT,
      late: counts.LATE,
      excused: counts.EXCUSED,
      totalStudents: s.records.length,
    };
  });

  return { items };
}

export async function getNetworkAttendanceOverview(query: NetworkAttendanceOverviewQuery) {
  const from = parseCalendarYmd(query.from);
  const to = parseCalendarYmd(query.to);
  if (!from || !to) return { error: "ATTENDANCE_INVALID_DATE" as const };
  if (from > to) return { error: "ATTENDANCE_INVALID_RANGE" as const };

  const fromD = prismaDateFromCalendarYmd(from);
  const toD = prismaDateFromCalendarYmd(to);

  const rows = await prisma.attendanceSession.findMany({
    where: {
      deleted_at: null,
      date: { gte: fromD, lte: toD },
      medresa_course: {
        deleted_at: null,
        ...(query.medresaId ? { medresa_id: query.medresaId } : {}),
      },
    },
    include: {
      records: { where: { deleted_at: null } },
      medresa_course: {
        select: {
          medresa_id: true,
          medresa: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ date: "asc" }, { medresa_course: { medresa_id: "asc" } }],
  });

  type Group = {
    date: string;
    medresaId: string;
    medresaName: string;
    present: number;
    absent: number;
    late: number;
    excused: number;
    totalStudents: number;
  };

  const groups = new Map<string, Group>();

  for (const s of rows) {
    const d = dateToCalendarEt(s.date);
    const mid = s.medresa_course.medresa_id;
    const key = `${d}|${mid}`;
    const existing = groups.get(key);
    const c = countStatuses(s.records.map((r) => r.status));

    if (!existing) {
      groups.set(key, {
        date: d,
        medresaId: mid,
        medresaName: s.medresa_course.medresa.name,
        present: c.PRESENT,
        absent: c.ABSENT,
        late: c.LATE,
        excused: c.EXCUSED,
        totalStudents: s.records.length,
      });
    } else {
      existing.present += c.PRESENT;
      existing.absent += c.ABSENT;
      existing.late += c.LATE;
      existing.excused += c.EXCUSED;
      existing.totalStudents += s.records.length;
    }
  }

  return { items: [...groups.values()] };
}
