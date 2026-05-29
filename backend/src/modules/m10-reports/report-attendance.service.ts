import type { Request } from "express";
import { AttendanceStatus, StudentStatus } from "../../../prisma/generated/prisma/enums";
import {
  ethiopianMonthEndYmd,
  ethiopianMonthStartYmd,
  toEthiopian,
} from "../../lib/ethiopian-calendar";
import {
  dateToCalendarEt,
  parseCalendarYmd,
  prismaDateFromCalendarYmd,
} from "../../lib/ethiopia-time";
import { prisma } from "../../lib/prisma";
import {
  assertCourseReportAccess,
  assertMedresaReportAccess,
  getTeacherAssignedCourseIds,
} from "./report-scope";
import type { z } from "zod";
import type { attendanceReportQuerySchema } from "./report.schema";

type AttendanceReportQuery = z.infer<typeof attendanceReportQuerySchema>;

const presentStatuses = new Set<AttendanceStatus>([
  AttendanceStatus.PRESENT,
  AttendanceStatus.LATE,
  AttendanceStatus.EXCUSED,
]);

export const getAttendanceReport = async (req: Request, query: AttendanceReportQuery) => {
  const courseAccess = await assertCourseReportAccess(req, query.medresaCourseId);
  if ("error" in courseAccess) return courseAccess;

  const medresaAccess = assertMedresaReportAccess(req, query.medresaId);
  if ("error" in medresaAccess) return medresaAccess;

  const fromYmd =
    query.from ?? ethiopianMonthStartYmd(query.fromYear, query.fromMonth);
  const toYmd = query.to ?? ethiopianMonthEndYmd(query.toYear, query.toMonth);
  const from = parseCalendarYmd(fromYmd);
  const to = parseCalendarYmd(toYmd);
  if (!from || !to) return { error: "INVALID_DATE_RANGE" as const };
  if (from > to) return { error: "INVALID_DATE_RANGE" as const };

  const fromD = prismaDateFromCalendarYmd(from);
  const toD = prismaDateFromCalendarYmd(to);

  let medresaIds: string[] | undefined;
  let courseIds: string[] | undefined;

  if (req.user!.isSuperAdmin) {
    if (query.medresaId) medresaIds = [query.medresaId];
    if (query.medresaCourseId) courseIds = [query.medresaCourseId];
  } else if ((req.user!.medresaRoles ?? []).some((r) => r.role === "ADMIN")) {
    const adminIds = (req.user!.medresaRoles ?? [])
      .filter((r) => r.role === "ADMIN")
      .map((r) => r.medresaId);
    medresaIds = query.medresaId && adminIds.includes(query.medresaId)
      ? [query.medresaId]
      : adminIds;
    if (query.medresaCourseId) courseIds = [query.medresaCourseId];
  } else {
    courseIds = await getTeacherAssignedCourseIds(req.user!.userId);
    if (query.medresaCourseId && !courseIds.includes(query.medresaCourseId)) {
      return { error: "FORBIDDEN" as const };
    }
    if (query.medresaCourseId) courseIds = [query.medresaCourseId];
  }

  const sessions = await prisma.attendanceSession.findMany({
    where: {
      deleted_at: null,
      date: { gte: fromD, lte: toD },
      ...(medresaIds ? { medresa_id: { in: medresaIds } } : {}),
    },
    include: {
      medresa: { select: { id: true, name: true } },
      records: {
        where: {
          deleted_at: null,
          ...(query.studentId ? { student_id: query.studentId } : {}),
        },
        include: { student: { select: { id: true, full_name: true } } },
      },
    },
    orderBy: { date: "asc" },
  });

  const studentMap = new Map<
    string,
    {
      studentId: string;
      fullName: string;
      present: number;
      absent: number;
      late: number;
      excused: number;
      total: number;
    }
  >();

  const dailyRows: Array<{
    date: string;
    ethiopianDate: { year: number; month: number; day: number };
    medresaId: string;
    medresaName: string;
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    ratePercent: number | null;
  }> = [];

  for (const session of sessions) {
    let p = 0;
    let a = 0;
    let l = 0;
    let e = 0;
    for (const r of session.records) {
      if (r.status === AttendanceStatus.PRESENT) p++;
      else if (r.status === AttendanceStatus.ABSENT) a++;
      else if (r.status === AttendanceStatus.LATE) l++;
      else if (r.status === AttendanceStatus.EXCUSED) e++;

      const existing = studentMap.get(r.student_id) ?? {
        studentId: r.student.id,
        fullName: r.student.full_name,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: 0,
      };
      existing.total += 1;
      if (presentStatuses.has(r.status)) existing.present += 1;
      else if (r.status === AttendanceStatus.ABSENT) existing.absent += 1;
      else if (r.status === AttendanceStatus.LATE) existing.late += 1;
      else if (r.status === AttendanceStatus.EXCUSED) existing.excused += 1;
      studentMap.set(r.student_id, existing);
    }
    const total = session.records.length;
    const present = p + l + e;
    const dateYmd = dateToCalendarEt(session.date);
    const parts = dateYmd.split("-").map(Number);
    const gy = parts[0] ?? 2020;
    const gm = parts[1] ?? 1;
    const gd = parts[2] ?? 1;
    dailyRows.push({
      date: dateYmd,
      ethiopianDate: toEthiopian(gy, gm, gd),
      medresaId: session.medresa.id,
      medresaName: session.medresa.name,
      present: p,
      absent: a,
      late: l,
      excused: e,
      total,
      ratePercent: total > 0 ? Math.round((present / total) * 10000) / 100 : null,
    });
  }

  const studentSummaries = [...studentMap.values()].map((s) => ({
    ...s,
    attendancePercent:
      s.total > 0 ? Math.round((s.present / s.total) * 10000) / 100 : null,
  }));

  let courseFilterNote: string | null = null;
  if (courseIds?.length) {
    courseFilterNote =
      "Attendance is tracked per medresa per day; course filter applies to enrolled students only.";
    const enrolled = await prisma.studentCourse.findMany({
      where: {
        medresa_course_id: { in: courseIds },
        deleted_at: null,
        student: { deleted_at: null, status: StudentStatus.ACTIVE },
      },
      select: { student_id: true },
    });
    const allowed = new Set(enrolled.map((e) => e.student_id));
    for (const key of [...studentMap.keys()]) {
      if (!allowed.has(key)) studentMap.delete(key);
    }
  }

  return {
    from: fromYmd,
    to: toYmd,
    ethiopianPeriod: {
      from: { month: query.fromMonth, year: query.fromYear },
      to: { month: query.toMonth, year: query.toYear },
    },
    courseFilterNote,
    dailyRows,
    studentSummaries,
  };
};
