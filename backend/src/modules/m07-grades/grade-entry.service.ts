import type { Request } from "express";
import { AuditAction, Status, StudentStatus } from "../../../prisma/generated/prisma/enums";
import { auditLog, getClientIp } from "../../lib/audit";
import { scoreToLetterGrade } from "../../lib/letter-grade";
import {
  getActiveTeacherIdForUser,
  loadMedresaCourseContext,
  studentEnrolledInCourse,
  teacherCanGradeCourse,
} from "../../lib/grade-scope";
import { assertMedresaActive } from "../../lib/medresa-scope";
import { prisma } from "../../lib/prisma";
import type { BatchGradesInput, CreateGradeInput } from "./grade.schema";
import { mapGrade } from "./grade.mapper";

const gradeInclude = {
  student_id: true,
  medresa_course_id: true,
  exam_type_id: true,
  teacher_id: true,
  numeric_score: true,
  letter_grade: true,
  submitted_at: true,
  id: true,
} as const;

const validateGradeRow = async (
  input: { studentId: string; medresaCourseId: string; examTypeId: string; numericScore: number },
  userId: string
): Promise<
  | { ok: true; letterGrade: ReturnType<typeof scoreToLetterGrade>; medresaId: string }
  | { error: string }
> => {
  const mc = await loadMedresaCourseContext(input.medresaCourseId);
  if (!mc || mc.status !== Status.ACTIVE) return { error: "MEDRESA_COURSE_NOT_FOUND" };

  const medresaActive = await assertMedresaActive(mc.medresa_id);
  if (!medresaActive) return { error: "MEDRESA_INACTIVE" };

  const canGrade = await teacherCanGradeCourse(userId, input.medresaCourseId);
  if (!canGrade) return { error: "FORBIDDEN" };

  const enrolled = await studentEnrolledInCourse(input.studentId, input.medresaCourseId);
  if (!enrolled) return { error: "STUDENT_NOT_ENROLLED" };

  const examType = await prisma.examType.findFirst({
    where: { id: input.examTypeId, deleted_at: null, status: Status.ACTIVE },
  });
  if (!examType) return { error: "EXAM_TYPE_NOT_FOUND" };

  if (input.numericScore > examType.max_score) return { error: "SCORE_OUT_OF_RANGE" };

  const existing = await prisma.grade.findFirst({
    where: {
      student_id: input.studentId,
      medresa_course_id: input.medresaCourseId,
      exam_type_id: input.examTypeId,
      deleted_at: null,
    },
  });
  if (existing) return { error: "GRADE_ALREADY_EXISTS" };

  return {
    ok: true,
    letterGrade: scoreToLetterGrade(input.numericScore),
    medresaId: mc.medresa_id,
  };
};

export const createGrade = async (
  userId: string,
  input: CreateGradeInput,
  req: Request
) => {
  const teacherId = await getActiveTeacherIdForUser(userId);
  if (!teacherId) return { error: "FORBIDDEN" as const };

  const check = await validateGradeRow(
    {
      studentId: input.studentId,
      medresaCourseId: input.medresaCourseId,
      examTypeId: input.examTypeId,
      numericScore: input.numericScore,
    },
    userId
  );
  if ("error" in check) return { error: check.error as string };

  const row = await prisma.grade.create({
    data: {
      student_id: input.studentId,
      medresa_course_id: input.medresaCourseId,
      exam_type_id: input.examTypeId,
      teacher_id: teacherId,
      numeric_score: input.numericScore,
      letter_grade: check.letterGrade,
    },
    select: gradeInclude,
  });

  await auditLog({
    tableName: "Grade",
    recordId: row.id,
    action: AuditAction.INSERT,
    performedBy: userId,
    newValues: { numeric_score: row.numeric_score, letter_grade: row.letter_grade },
    ip: getClientIp(req),
  });

  return { grade: mapGrade(row) };
};

export const batchCreateGrades = async (
  userId: string,
  input: BatchGradesInput,
  req: Request
) => {
  const teacherId = await getActiveTeacherIdForUser(userId);
  if (!teacherId) return { error: "FORBIDDEN" as const };

  const created: ReturnType<typeof mapGrade>[] = [];
  const errors: { studentId: string; code: string }[] = [];

  for (const g of input.grades) {
    const check = await validateGradeRow(
      {
        studentId: g.studentId,
        medresaCourseId: input.medresaCourseId,
        examTypeId: input.examTypeId,
        numericScore: g.numericScore,
      },
      userId
    );
    if ("error" in check) {
      errors.push({ studentId: g.studentId, code: check.error });
      continue;
    }

    const row = await prisma.grade.create({
      data: {
        student_id: g.studentId,
        medresa_course_id: input.medresaCourseId,
        exam_type_id: input.examTypeId,
        teacher_id: teacherId,
        numeric_score: g.numericScore,
        letter_grade: check.letterGrade,
      },
      select: gradeInclude,
    });

    await auditLog({
      tableName: "Grade",
      recordId: row.id,
      action: AuditAction.INSERT,
      performedBy: userId,
      newValues: { numeric_score: row.numeric_score, letter_grade: row.letter_grade },
      ip: getClientIp(req),
    });

    created.push(mapGrade(row));
  }

  if (created.length === 0 && errors.length > 0) {
    return { error: errors[0]!.code };
  }

  return { created, errors: errors.length > 0 ? errors : undefined };
};

export const listTeacherAssignedCourses = async (userId: string) => {
  const teacherId = await getActiveTeacherIdForUser(userId);
  if (!teacherId) return { error: "FORBIDDEN" as const };

  const assignments = await prisma.courseAssignment.findMany({
    where: {
      teacher_id: teacherId,
      deleted_at: null,
      medresa_course: {
        deleted_at: null,
        status: Status.ACTIVE,
        medresa: { deleted_at: null, status: Status.ACTIVE },
      },
    },
    include: {
      medresa_course: {
        include: {
          course: { select: { name: true } },
          medresa: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { medresa_course: { medresa: { name: "asc" } } },
  });

  const pickName = (name: unknown): string => {
    if (name && typeof name === "object" && "en" in name) {
      const en = (name as { en?: string }).en;
      return typeof en === "string" ? en : "Course";
    }
    return "Course";
  };

  return {
    items: assignments.map((a) => ({
      medresaCourseId: a.medresa_course_id,
      medresaId: a.medresa_course.medresa_id,
      medresaName: a.medresa_course.medresa.name,
      courseName: pickName(a.medresa_course.course.name),
    })),
  };
};

export const listCourseGradesForEntry = async (
  userId: string,
  medresaCourseId: string,
  examTypeId: string
) => {
  const canGrade = await teacherCanGradeCourse(userId, medresaCourseId);
  if (!canGrade) return { error: "FORBIDDEN" as const };

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

  const existing = await prisma.grade.findMany({
    where: {
      medresa_course_id: medresaCourseId,
      exam_type_id: examTypeId,
      deleted_at: null,
    },
    select: gradeInclude,
  });

  const byStudent = new Map(existing.map((g) => [g.student_id, mapGrade(g)]));

  return {
    items: enrollments.map((e) => ({
      studentId: e.student.id,
      fullName: e.student.full_name,
      grade: byStudent.get(e.student.id) ?? null,
    })),
  };
};
