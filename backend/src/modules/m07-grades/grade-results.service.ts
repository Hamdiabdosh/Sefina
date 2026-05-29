import type { Request } from "express";
import { Status, StudentStatus } from "../../../prisma/generated/prisma/enums";
import {
  computeOverallGpaPercent,
  computeWeightedTotalPercent,
  type ExamGradeRow,
} from "../../lib/grade-calculations";
import {
  canReadStudentGrades,
  loadMedresaCourseContext,
  teacherCanGradeCourse,
} from "../../lib/grade-scope";
import { hasMedresaAdminRole } from "../../lib/student-scope";
import { prisma } from "../../lib/prisma";

const pickLocalizedName = (name: unknown): string => {
  if (name && typeof name === "object" && "en" in name) {
    const en = (name as { en?: string }).en;
    return typeof en === "string" ? en : "Course";
  }
  return "Course";
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

/** Shared student results payload (no auth). */
export const buildStudentResultsPayload = async (studentId: string) => {
  const student = await prisma.student.findFirst({
    where: { id: studentId, deleted_at: null },
    select: { id: true, full_name: true },
  });
  if (!student) return null;

  const enrollments = await prisma.studentCourse.findMany({
    where: {
      student_id: studentId,
      deleted_at: null,
      medresa_course: { deleted_at: null, status: Status.ACTIVE },
    },
    include: {
      medresa_course: {
        include: {
          course: { select: { name: true } },
          grades: {
            where: { student_id: studentId, deleted_at: null },
            include: {
              exam_type: { select: { id: true, name: true, max_score: true, weight: true } },
            },
          },
        },
      },
    },
  });

  const courses = enrollments.map((e) => {
    const exams = buildCourseExams(e.medresa_course.grades);
    return {
      medresaCourseId: e.medresa_course_id,
      courseName: pickLocalizedName(e.medresa_course.course.name),
      exams: exams.map((x) => ({
        examTypeId: x.examTypeId,
        name: x.name,
        score: x.numericScore,
        maxScore: x.maxScore,
        weight: x.weight,
        letterGrade: x.letterGrade,
      })),
      weightedTotalPercent: computeWeightedTotalPercent(exams),
    };
  });

  const overallGpaPercent = computeOverallGpaPercent(
    courses.map((c) => c.weightedTotalPercent)
  );

  return {
    studentId: student.id,
    fullName: student.full_name,
    courses,
    overallGpaPercent,
  };
};

export const getStudentResults = async (req: Request, studentId: string) => {
  const allowed = await canReadStudentGrades(req, studentId);
  if (!allowed) return { error: "FORBIDDEN" as const };

  const payload = await buildStudentResultsPayload(studentId);
  if (!payload) return { error: "STUDENT_NOT_FOUND" as const };
  return payload;
};

export const getMedresaCourseResults = async (
  req: Request,
  medresaCourseId: string
) => {
  const mc = await loadMedresaCourseContext(medresaCourseId);
  if (!mc) return { error: "MEDRESA_COURSE_NOT_FOUND" as const };

  if (req.user!.isSuperAdmin) {
    // ok
  } else if (hasMedresaAdminRole(req, mc.medresa_id)) {
    // ok
  } else if (await teacherCanGradeCourse(req.user!.userId, medresaCourseId)) {
    // ok
  } else {
    return { error: "FORBIDDEN" as const };
  }

  const enrollments = await prisma.studentCourse.findMany({
    where: {
      medresa_course_id: medresaCourseId,
      deleted_at: null,
      student: { deleted_at: null, status: StudentStatus.ACTIVE },
    },
    include: {
      student: { select: { id: true, full_name: true } },
    },
    orderBy: { student: { full_name: "asc" } },
  });

  const grades = await prisma.grade.findMany({
    where: { medresa_course_id: medresaCourseId, deleted_at: null },
    include: {
      exam_type: { select: { id: true, name: true, max_score: true, weight: true } },
      student: { select: { id: true } },
    },
  });

  const examTypes = await prisma.examType.findMany({
    where: { deleted_at: null, status: Status.ACTIVE },
    orderBy: { created_at: "asc" },
  });

  const gradesByStudent = new Map<string, typeof grades>();
  for (const g of grades) {
    const list = gradesByStudent.get(g.student_id) ?? [];
    list.push(g);
    gradesByStudent.set(g.student_id, list);
  }

  const students = enrollments.map((e) => {
    const sg = gradesByStudent.get(e.student.id) ?? [];
    const exams = buildCourseExams(sg);
    return {
      studentId: e.student.id,
      fullName: e.student.full_name,
      exams: exams.map((x) => ({
        examTypeId: x.examTypeId,
        name: x.name,
        score: x.numericScore,
        maxScore: x.maxScore,
        weight: x.weight,
        letterGrade: x.letterGrade,
      })),
      weightedTotalPercent: computeWeightedTotalPercent(exams),
    };
  });

  return {
    medresaCourseId,
    courseName: pickLocalizedName(mc.course.name),
    examTypes: examTypes.map((et) => ({
      id: et.id,
      name: et.name,
      maxScore: et.max_score,
      weight: et.weight,
    })),
    students,
  };
};

export const getMedresaResultsOverview = async (req: Request, medresaId: string) => {
  if (!req.user!.isSuperAdmin && !hasMedresaAdminRole(req, medresaId)) {
    return { error: "FORBIDDEN" as const };
  }

  const courses = await prisma.medresaCourse.findMany({
    where: { medresa_id: medresaId, deleted_at: null, status: Status.ACTIVE },
    include: {
      course: { select: { name: true } },
      assignments: {
        where: { deleted_at: null },
        take: 1,
        include: { teacher: { select: { id: true, user: { select: { full_name: true } } } } },
      },
      grades: {
        where: { deleted_at: null },
        include: {
          exam_type: { select: { name: true, max_score: true, weight: true } },
          student_id: true,
          exam_type_id: true,
          numeric_score: true,
          letter_grade: true,
        },
      },
      student_courses: {
        where: { deleted_at: null },
        select: { student_id: true },
      },
    },
  });

  const items = courses.map((mc) => {
    const byStudent = new Map<string, typeof mc.grades>();
    for (const g of mc.grades) {
      const list = byStudent.get(g.student_id) ?? [];
      list.push(g);
      byStudent.set(g.student_id, list);
    }

    const percents: number[] = [];
    for (const studentId of mc.student_courses.map((sc) => sc.student_id)) {
      const sg = byStudent.get(studentId) ?? [];
      const exams = buildCourseExams(sg);
      const p = computeWeightedTotalPercent(exams);
      if (p !== null) percents.push(p);
    }

    const avg =
      percents.length > 0
        ? Math.round((percents.reduce((a, b) => a + b, 0) / percents.length) * 100) / 100
        : null;
    const high = percents.length > 0 ? Math.max(...percents) : null;
    const low = percents.length > 0 ? Math.min(...percents) : null;

    const assignment = mc.assignments[0];
    return {
      medresaCourseId: mc.id,
      courseName: pickLocalizedName(mc.course.name),
      assignedTeacher: assignment
        ? { id: assignment.teacher.id, fullName: assignment.teacher.user.full_name }
        : null,
      studentCount: mc.student_courses.length,
      averagePercent: avg,
      highestPercent: high,
      lowestPercent: low,
    };
  });

  return { medresaId, courses: items };
};

export const getNetworkResultsOverview = async (req: Request) => {
  if (!req.user!.isSuperAdmin) return { error: "FORBIDDEN" as const };

  const medresas = await prisma.medresa.findMany({
    where: { deleted_at: null, status: Status.ACTIVE },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const items = [];
  for (const m of medresas) {
    const overview = await getMedresaResultsOverview(req, m.id);
    if ("error" in overview) continue;
    const percents = overview.courses
      .map((c) => c.averagePercent)
      .filter((p): p is number => p !== null);
    const networkAvg =
      percents.length > 0
        ? Math.round((percents.reduce((a, b) => a + b, 0) / percents.length) * 100) / 100
        : null;
    items.push({
      medresaId: m.id,
      medresaName: m.name,
      courseCount: overview.courses.length,
      averagePercent: networkAvg,
      courses: overview.courses,
    });
  }

  return { items };
};
