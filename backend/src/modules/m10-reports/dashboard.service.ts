import type { Request } from "express";
import { AttendanceStatus, Status, StudentStatus } from "../../../prisma/generated/prisma/enums";
import {
  computeWeightedTotalPercent,
  type ExamGradeRow,
} from "../../lib/grade-calculations";
import { getActiveTeacherIdForUser } from "../../lib/grade-scope";
import {
  getCalendarDateEt,
  prismaDateFromCalendarYmd,
  subtractGregorianDays,
} from "../../lib/ethiopia-time";
import {
  getEthiopianToday,
  iterateEthiopianMonths,
  toGregorian,
} from "../../lib/ethiopian-calendar";
import { prisma } from "../../lib/prisma";
import { centsToEtb, pickLocalizedName } from "./report.mapper";
import {
  getTeacherAssignedCourseIds,
  resolveMedresaIdForDashboard,
} from "./report-scope";
import type { MedresaDashboardQuery } from "./report.schema";

const presentStatuses = new Set<AttendanceStatus>([
  AttendanceStatus.PRESENT,
  AttendanceStatus.LATE,
  AttendanceStatus.EXCUSED,
]);

const attendanceRate = (present: number, total: number): number | null =>
  total > 0 ? Math.round((present / total) * 10000) / 100 : null;

const countSessionRates = (
  records: { status: AttendanceStatus }[]
): { present: number; total: number; rate: number | null } => {
  const total = records.length;
  const present = records.filter((r) => presentStatuses.has(r.status)).length;
  return { present, total, rate: attendanceRate(present, total) };
};

const buildCourseExams = (
  grades: {
    exam_type_id: string;
    numeric_score: number;
    letter_grade: string;
    exam_type: { name: unknown; max_score: number; weight: number };
  }[]
): ExamGradeRow[] =>
  grades.map((g) => ({
    examTypeId: g.exam_type_id,
    name: g.exam_type.name,
    numericScore: g.numeric_score,
    maxScore: g.exam_type.max_score,
    weight: g.exam_type.weight,
    letterGrade: g.letter_grade as ExamGradeRow["letterGrade"],
  }));

export const getTeacherDashboard = async (req: Request) => {
  const teacherId = await getActiveTeacherIdForUser(req.user!.userId);
  if (!teacherId) return { error: "FORBIDDEN" as const };

  const courseIds = await getTeacherAssignedCourseIds(req.user!.userId);
  const enrollments = await prisma.studentCourse.findMany({
    where: {
      medresa_course_id: { in: courseIds },
      deleted_at: null,
      student: { deleted_at: null, status: StudentStatus.ACTIVE },
    },
    select: { student_id: true, medresa_course_id: true },
  });
  const uniqueStudents = new Set(enrollments.map((e) => e.student_id));

  const todayYmd = getCalendarDateEt();
  const todayDate = prismaDateFromCalendarYmd(todayYmd);

  const medresaIds = new Set<string>();
  if (courseIds.length > 0) {
    const mcs = await prisma.medresaCourse.findMany({
      where: { id: { in: courseIds } },
      select: { medresa_id: true },
    });
    for (const mc of mcs) medresaIds.add(mc.medresa_id);
  }

  let todayPresent = 0;
  let todayTotal = 0;
  for (const medresaId of medresaIds) {
    const session = await prisma.attendanceSession.findFirst({
      where: { medresa_id: medresaId, date: todayDate, deleted_at: null },
      include: { records: { where: { deleted_at: null } } },
    });
    if (session) {
      const c = countSessionRates(session.records);
      todayPresent += c.present;
      todayTotal += c.total;
    }
  }

  const activeExamTypes = await prisma.examType.findMany({
    where: { deleted_at: null, status: Status.ACTIVE },
    select: { id: true },
  });
  const examTypeIds = activeExamTypes.map((e) => e.id);

  let pendingGradeEntries = 0;
  if (examTypeIds.length > 0 && enrollments.length > 0) {
    const existing = await prisma.grade.findMany({
      where: {
        deleted_at: null,
        medresa_course_id: { in: courseIds },
        exam_type_id: { in: examTypeIds },
      },
      select: { student_id: true, medresa_course_id: true, exam_type_id: true },
    });
    const have = new Set(
      existing.map((g) => `${g.student_id}:${g.medresa_course_id}:${g.exam_type_id}`)
    );
    for (const e of enrollments) {
      for (const etId of examTypeIds) {
        if (!have.has(`${e.student_id}:${e.medresa_course_id}:${etId}`)) {
          pendingGradeEntries += 1;
        }
      }
    }
  }

  const trend: Array<{ date: string; ratePercent: number | null }> = [];
  for (let i = 29; i >= 0; i--) {
    const ymd = subtractGregorianDays(todayYmd, i);
    const d = prismaDateFromCalendarYmd(ymd);
    let p = 0;
    let t = 0;
    for (const medresaId of medresaIds) {
      const session = await prisma.attendanceSession.findFirst({
        where: { medresa_id: medresaId, date: d, deleted_at: null },
        include: { records: { where: { deleted_at: null } } },
      });
      if (session) {
        const c = countSessionRates(session.records);
        p += c.present;
        t += c.total;
      }
    }
    trend.push({ date: ymd, ratePercent: attendanceRate(p, t) });
  }

  const gradeDistribution: Array<{
    medresaCourseId: string;
    courseName: string;
    distribution: Record<string, number>;
  }> = [];

  for (const courseId of courseIds) {
    const mc = await prisma.medresaCourse.findFirst({
      where: { id: courseId },
      include: { course: { select: { name: true } } },
    });
    if (!mc) continue;
    const grades = await prisma.grade.findMany({
      where: { medresa_course_id: courseId, deleted_at: null },
      select: { letter_grade: true },
    });
    const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const g of grades) {
      dist[g.letter_grade] = (dist[g.letter_grade] ?? 0) + 1;
    }
    gradeDistribution.push({
      medresaCourseId: courseId,
      courseName: pickLocalizedName(mc.course.name),
      distribution: dist,
    });
  }

  const etToday = getEthiopianToday();

  return {
    ethiopianDate: etToday,
    totalStudents: uniqueStudents.size,
    activeCourses: courseIds.length,
    todayAttendanceRatePercent: attendanceRate(todayPresent, todayTotal),
    pendingGradeEntries,
    attendanceTrend: trend,
    gradeDistribution,
    quickActions: {
      attendanceTakePath: "/teacher/attendance/take",
      gradeEntryPath: "/teacher/grades/entry",
      studentsPath: "/teacher/students",
    },
  };
};

const sumFeeBalancesForMedresa = async (medresaId: string) => {
  const balances = await prisma.feeBalance.findMany({
    where: { medresa_id: medresaId },
    select: { total_paid: true, outstanding_balance: true },
  });
  const collectedCents = balances.reduce((s, b) => s + b.total_paid, 0);
  const outstandingCents = balances.reduce((s, b) => s + b.outstanding_balance, 0);
  return { collectedEtb: centsToEtb(collectedCents), outstandingEtb: centsToEtb(outstandingCents) };
};

export const getMedresaDashboard = async (req: Request, query: MedresaDashboardQuery) => {
  const resolved = resolveMedresaIdForDashboard(req, query.medresaId);
  if ("error" in resolved) return resolved;
  const medresaId = resolved.medresaId;

  const todayYmd = getCalendarDateEt();
  const todayDate = prismaDateFromCalendarYmd(todayYmd);
  const etToday = getEthiopianToday();

  const [studentCount, courseCount, sessionToday, courses] = await Promise.all([
    prisma.student.count({
      where: {
        current_medresa_id: medresaId,
        deleted_at: null,
        status: StudentStatus.ACTIVE,
      },
    }),
    prisma.medresaCourse.count({
      where: { medresa_id: medresaId, deleted_at: null, status: Status.ACTIVE },
    }),
    prisma.attendanceSession.findFirst({
      where: { medresa_id: medresaId, date: todayDate, deleted_at: null },
      include: { records: { where: { deleted_at: null } } },
    }),
    prisma.medresaCourse.findMany({
      where: { medresa_id: medresaId, deleted_at: null, status: Status.ACTIVE },
      include: {
        course: { select: { name: true } },
        grades: {
          where: { deleted_at: null },
          include: {
            exam_type: { select: { name: true, max_score: true, weight: true } },
            student_id: true,
          },
        },
        student_courses: { where: { deleted_at: null }, select: { student_id: true } },
      },
    }),
  ]);

  const todayRate = sessionToday
    ? countSessionRates(sessionToday.records).rate
    : null;

  const fees = await sumFeeBalancesForMedresa(medresaId);

  const feeTrend: Array<{
    month: number;
    year: number;
    collectedEtb: number;
    outstandingEtb: number;
  }> = [];
  let m = etToday.month;
  let y = etToday.year;
  const monthsBack: Array<{ month: number; year: number }> = [];
  for (let i = 0; i < 6; i++) {
    monthsBack.unshift({ month: m, year: y });
    m -= 1;
    if (m < 1) {
      m = 13;
      y -= 1;
    }
  }
  for (const { month, year } of monthsBack) {
    const payments = await prisma.feePayment.findMany({
      where: { medresa_id: medresaId, month, year, deleted_at: null },
      select: { amount_paid: true },
    });
    const collected = payments.reduce((s, p) => s + p.amount_paid, 0);
    feeTrend.push({
      month,
      year,
      collectedEtb: centsToEtb(collected),
      outstandingEtb: fees.outstandingEtb,
    });
  }

  const enrollmentTrend: Array<{ month: number; year: number; count: number }> = [];
  const startEnroll = { month: etToday.month, year: etToday.year - 1 };
  for (const { month, year } of iterateEthiopianMonths(startEnroll, etToday)) {
    const lastDay = month === 13 ? (year % 4 === 3 ? 6 : 5) : 30;
    const [gy, gm, gd] = toGregorian(year, month, lastDay);
    const endDate = new Date(Date.UTC(gy, gm - 1, gd, 23, 59, 59));
    const count = await prisma.student.count({
      where: {
        current_medresa_id: medresaId,
        deleted_at: null,
        enrolled_at: { lte: endDate },
        OR: [{ status: StudentStatus.ACTIVE }, { status: StudentStatus.TRANSFERRED }],
      },
    });
    enrollmentTrend.push({ month, year, count });
  }

  const courseStats = await Promise.all(
    courses.map(async (mc) => {
      const session = await prisma.attendanceSession.findFirst({
        where: { medresa_id: medresaId, date: todayDate, deleted_at: null },
        include: { records: { where: { deleted_at: null, student_id: { in: mc.student_courses.map((s) => s.student_id) } } } },
      });
      const attRate = session ? countSessionRates(session.records).rate : null;

      const percents: number[] = [];
      const byStudent = new Map<string, typeof mc.grades>();
      for (const g of mc.grades) {
        const list = byStudent.get(g.student_id) ?? [];
        list.push(g);
        byStudent.set(g.student_id, list);
      }
      for (const sc of mc.student_courses) {
        const sg = byStudent.get(sc.student_id) ?? [];
        const p = computeWeightedTotalPercent(buildCourseExams(sg));
        if (p !== null) percents.push(p);
      }
      const gradeAvg =
        percents.length > 0
          ? Math.round((percents.reduce((a, b) => a + b, 0) / percents.length) * 100) / 100
          : null;

      return {
        medresaCourseId: mc.id,
        courseName: pickLocalizedName(mc.course.name),
        studentCount: mc.student_courses.length,
        todayAttendanceRatePercent: attRate,
        averageGradePercent: gradeAvg,
      };
    })
  );

  return {
    medresaId,
    ethiopianDate: etToday,
    totalStudents: studentCount,
    activeCourses: courseCount,
    todayAttendanceRatePercent: todayRate,
    feesCollectedEtb: fees.collectedEtb,
    outstandingFeesEtb: fees.outstandingEtb,
    feeTrend,
    enrollmentTrend,
    courseStats,
    quickActions: {
      recordPaymentPath: "/medresa/fees",
      unpaidStudentsPath: "/medresa/fees?status=UNPAID",
      reportsPath: "/medresa/reports",
    },
  };
};

export const getSuperAdminDashboard = async (req: Request) => {
  if (!req.user!.isSuperAdmin) return { error: "FORBIDDEN" as const };

  const etToday = getEthiopianToday();
  const todayDate = prismaDateFromCalendarYmd(getCalendarDateEt());

  const [activeMedresas, inactiveMedresas, teacherCount, studentCount] = await Promise.all([
    prisma.medresa.count({ where: { deleted_at: null, status: Status.ACTIVE } }),
    prisma.medresa.count({ where: { deleted_at: null, status: Status.INACTIVE } }),
    prisma.teacher.count({ where: { deleted_at: null, status: Status.ACTIVE } }),
    prisma.student.count({
      where: { deleted_at: null, status: StudentStatus.ACTIVE },
    }),
  ]);

  const allBalances = await prisma.feeBalance.findMany({
    select: { total_paid: true, outstanding_balance: true },
  });
  const networkFeesCollectedEtb = centsToEtb(
    allBalances.reduce((s, b) => s + b.total_paid, 0)
  );
  const networkOutstandingEtb = centsToEtb(
    allBalances.reduce((s, b) => s + b.outstanding_balance, 0)
  );

  const salaryPayments = await prisma.salaryPayment.findMany({
    where: { month: etToday.month, year: etToday.year, deleted_at: null },
    select: { amount_paid: true, teacher_id: true },
  });
  const salaryDisbursedEtb = centsToEtb(
    salaryPayments.reduce((s, p) => s + p.amount_paid, 0)
  );
  const paidTeacherIds = new Set(salaryPayments.map((p) => p.teacher_id));
  const unpaidTeachersThisMonth = teacherCount - paidTeacherIds.size;

  const medresas = await prisma.medresa.findMany({
    where: { deleted_at: null, status: Status.ACTIVE },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const enrollmentPerMedresa = await Promise.all(
    medresas.map(async (m) => ({
      medresaId: m.id,
      medresaName: m.name,
      studentCount: await prisma.student.count({
        where: {
          current_medresa_id: m.id,
          deleted_at: null,
          status: StudentStatus.ACTIVE,
        },
      }),
    }))
  );

  const feeTrend: Array<{ month: number; year: number; collectedEtb: number }> = [];
  let m = etToday.month;
  let y = etToday.year;
  const months: Array<{ month: number; year: number }> = [];
  for (let i = 0; i < 6; i++) {
    months.unshift({ month: m, year: y });
    m -= 1;
    if (m < 1) {
      m = 13;
      y -= 1;
    }
  }
  for (const { month, year } of months) {
    const payments = await prisma.feePayment.findMany({
      where: { month, year, deleted_at: null },
      select: { amount_paid: true },
    });
    feeTrend.push({
      month,
      year,
      collectedEtb: centsToEtb(payments.reduce((s, p) => s + p.amount_paid, 0)),
    });
  }

  const salaryTrend: Array<{ month: number; year: number; disbursedEtb: number }> = [];
  for (const { month, year } of months) {
    const payments = await prisma.salaryPayment.findMany({
      where: { month, year, deleted_at: null },
      select: { amount_paid: true },
    });
    salaryTrend.push({
      month,
      year,
      disbursedEtb: centsToEtb(payments.reduce((s, p) => s + p.amount_paid, 0)),
    });
  }

  const attendancePerMedresa = await Promise.all(
    medresas.map(async (m) => {
      const session = await prisma.attendanceSession.findFirst({
        where: { medresa_id: m.id, date: todayDate, deleted_at: null },
        include: { records: { where: { deleted_at: null } } },
      });
      return {
        medresaId: m.id,
        medresaName: m.name,
        todayAttendanceRatePercent: session
          ? countSessionRates(session.records).rate
          : null,
      };
    })
  );

  const gradePerMedresa = await Promise.all(
    medresas.map(async (m) => {
      const grades = await prisma.grade.findMany({
        where: {
          deleted_at: null,
          medresa_course: { medresa_id: m.id, deleted_at: null },
        },
        include: {
          exam_type: { select: { max_score: true, weight: true, name: true } },
        },
      });
      const byCourseStudent = new Map<string, ExamGradeRow[]>();
      for (const g of grades) {
        const key = `${g.medresa_course_id}:${g.student_id}`;
        const list = byCourseStudent.get(key) ?? [];
        list.push({
          examTypeId: g.exam_type_id,
          name: g.exam_type.name,
          numericScore: g.numeric_score,
          maxScore: g.exam_type.max_score,
          weight: g.exam_type.weight,
          letterGrade: g.letter_grade as ExamGradeRow["letterGrade"],
        });
        byCourseStudent.set(key, list);
      }
      const percents: number[] = [];
      for (const exams of byCourseStudent.values()) {
        const p = computeWeightedTotalPercent(exams);
        if (p !== null) percents.push(p);
      }
      return {
        medresaId: m.id,
        medresaName: m.name,
        averageGradePercent:
          percents.length > 0
            ? Math.round((percents.reduce((a, b) => a + b, 0) / percents.length) * 100) / 100
            : null,
      };
    })
  );

  return {
    ethiopianDate: etToday,
    activeMedresas,
    inactiveMedresas,
    totalTeachers: teacherCount,
    totalStudents: studentCount,
    networkFeesCollectedEtb,
    networkOutstandingEtb,
    salaryDisbursedThisMonthEtb: salaryDisbursedEtb,
    unpaidTeachersThisMonth: Math.max(0, unpaidTeachersThisMonth),
    enrollmentPerMedresa,
    feeTrend,
    salaryTrend,
    attendancePerMedresa,
    gradePerMedresa,
    quickActions: {
      unpaidTeachersPath: "/admin/salaries?status=UNPAID",
      feeDefaultersPath: "/admin/fees",
      reportsPath: "/admin/reports",
    },
  };
};
