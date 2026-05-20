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

  const session = await prisma.attendanceSession.findFirst({
    where: {
      deleted_at: null,
      date: prismaDate,
      medresa_id: medresaId,
    },
    include: {
      records: { where: { deleted_at: null } },
    },
  });

  if (!session) {
    return { items: [] as const };
  }

  const c = countStatuses(session.records.map((r) => r.status));

  return {
    items: [
      {
        sessionId: session.id,
        medresaId: session.medresa_id,
        teacherMarkedAt: session.teacher_marked_at ? session.teacher_marked_at.toISOString() : null,
        adminMarkedAt: session.admin_marked_at ? session.admin_marked_at.toISOString() : null,
        present: c.PRESENT,
        absent: c.ABSENT,
        late: c.LATE,
        excused: c.EXCUSED,
        totalStudents: session.records.length,
      },
    ],
  };
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
      ...(query.medresaId ? { medresa_id: query.medresaId } : {}),
      medresa: { deleted_at: null },
    },
    include: {
      records: { where: { deleted_at: null } },
      medresa: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ date: "asc" }, { medresa_id: "asc" }],
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
    const mid = s.medresa.id;
    const key = `${d}|${mid}`;
    const existing = groups.get(key);
    const c = countStatuses(s.records.map((r) => r.status));

    if (!existing) {
      groups.set(key, {
        date: d,
        medresaId: mid,
        medresaName: s.medresa.name,
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
