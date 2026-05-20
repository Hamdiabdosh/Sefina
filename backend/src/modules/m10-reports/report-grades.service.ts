import type { Request } from "express";
import { Status, StudentStatus } from "../../../prisma/generated/prisma/enums";
import {
  computeWeightedTotalPercent,
  type ExamGradeRow,
} from "../../lib/grade-calculations";
import { prisma } from "../../lib/prisma";
import { pickLocalizedName } from "./report.mapper";
import {
  assertCourseReportAccess,
  assertMedresaReportAccess,
  getTeacherAssignedCourseIds,
} from "./report-scope";
import type { ReportRangeQuery } from "./report.schema";

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

export const getGradesReport = async (req: Request, query: ReportRangeQuery) => {
  const courseAccess = await assertCourseReportAccess(req, query.medresaCourseId);
  if ("error" in courseAccess) return courseAccess;

  const medresaAccess = assertMedresaReportAccess(req, query.medresaId);
  if ("error" in medresaAccess) return medresaAccess;

  let courseIds: string[] = [];

  if (query.medresaCourseId) {
    courseIds = [query.medresaCourseId];
  } else if (req.user!.isSuperAdmin) {
    const where = query.medresaId
      ? { medresa_id: query.medresaId, deleted_at: null, status: Status.ACTIVE }
      : { deleted_at: null, status: Status.ACTIVE };
    const rows = await prisma.medresaCourse.findMany({
      where,
      select: { id: true },
    });
    courseIds = rows.map((r) => r.id);
  } else if ((req.user!.medresaRoles ?? []).some((r) => r.role === "ADMIN")) {
    const adminIds = (req.user!.medresaRoles ?? [])
      .filter((r) => r.role === "ADMIN")
      .map((r) => r.medresaId);
    const targetMedresa = query.medresaId && adminIds.includes(query.medresaId)
      ? query.medresaId
      : adminIds[0];
    if (!targetMedresa) return { error: "FORBIDDEN" as const };
    const rows = await prisma.medresaCourse.findMany({
      where: { medresa_id: targetMedresa, deleted_at: null, status: Status.ACTIVE },
      select: { id: true },
    });
    courseIds = rows.map((r) => r.id);
  } else {
    courseIds = await getTeacherAssignedCourseIds(req.user!.userId);
  }

  const examTypeFilter = query.examTypeId ? { exam_type_id: query.examTypeId } : {};

  const courses = await prisma.medresaCourse.findMany({
    where: { id: { in: courseIds }, deleted_at: null },
    include: {
      course: { select: { name: true } },
      medresa: { select: { id: true, name: true } },
      grades: {
        where: {
          deleted_at: null,
          ...examTypeFilter,
          ...(query.studentId ? { student_id: query.studentId } : {}),
        },
        include: {
          student: { select: { id: true, full_name: true } },
          exam_type: { select: { id: true, name: true, max_score: true, weight: true } },
        },
      },
      student_courses: {
        where: { deleted_at: null, student: { status: StudentStatus.ACTIVE } },
        select: { student_id: true },
      },
    },
  });

  const items: Array<{
    medresaCourseId: string;
    courseName: string;
    medresaName: string;
    classAveragePercent: number | null;
    students: Array<{
      studentId: string;
      fullName: string;
      weightedTotalPercent: number | null;
      exams: Array<{
        examTypeId: string;
        name: unknown;
        score: number;
        maxScore: number;
        weight: number;
        letterGrade: string;
      }>;
    }>;
  }> = [];

  for (const mc of courses) {
    const byStudent = new Map<string, typeof mc.grades>();
    for (const g of mc.grades) {
      const list = byStudent.get(g.student_id) ?? [];
      list.push(g);
      byStudent.set(g.student_id, list);
    }

    const studentNames = await prisma.student.findMany({
      where: { id: { in: mc.student_courses.map((sc) => sc.student_id) } },
      select: { id: true, full_name: true },
    });
    const nameById = new Map(studentNames.map((s) => [s.id, s.full_name]));

    const students = mc.student_courses.map((sc) => {
      const sg = byStudent.get(sc.student_id) ?? [];
      const exams = buildCourseExams(sg);
      return {
        studentId: sc.student_id,
        fullName: nameById.get(sc.student_id) ?? "—",
        weightedTotalPercent: computeWeightedTotalPercent(exams),
        exams: exams.map((x) => ({
          examTypeId: x.examTypeId,
          name: x.name,
          score: x.numericScore,
          maxScore: x.maxScore,
          weight: x.weight,
          letterGrade: x.letterGrade,
        })),
      };
    });

    const percents = students
      .map((s) => s.weightedTotalPercent)
      .filter((p): p is number => p !== null);
    const classAvg =
      percents.length > 0
        ? Math.round((percents.reduce((a, b) => a + b, 0) / percents.length) * 100) / 100
        : null;

    items.push({
      medresaCourseId: mc.id,
      courseName: pickLocalizedName(mc.course.name),
      medresaName: mc.medresa.name,
      classAveragePercent: classAvg,
      students,
    });
  }

  return {
    ethiopianYear: query.fromYear,
    items,
  };
};
