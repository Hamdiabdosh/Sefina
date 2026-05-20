import type { LetterGrade } from "../../../prisma/generated/prisma/enums";

export const mapExamType = (row: {
  id: string;
  name: unknown;
  max_score: number;
  weight: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}) => ({
  id: row.id,
  name: row.name,
  maxScore: row.max_score,
  weight: row.weight,
  status: row.status,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

export const mapGrade = (row: {
  id: string;
  student_id: string;
  medresa_course_id: string;
  exam_type_id: string;
  teacher_id: string;
  numeric_score: number;
  letter_grade: LetterGrade;
  submitted_at: Date;
}) => ({
  id: row.id,
  studentId: row.student_id,
  medresaCourseId: row.medresa_course_id,
  examTypeId: row.exam_type_id,
  teacherId: row.teacher_id,
  numericScore: row.numeric_score,
  letterGrade: row.letter_grade,
  submittedAt: row.submitted_at.toISOString(),
});

export const mapGradeEditRequest = (row: {
  id: string;
  grade_id: string;
  requested_by: string;
  current_score: number;
  requested_score: number;
  reason: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  rejection_reason: string | null;
  created_at: Date;
  grade?: {
    student: { full_name: string };
    medresa_course: {
      course: { name: unknown };
      medresa_id: string;
    };
    exam_type: { name: unknown };
    teacher: { full_name: string };
  };
}) => ({
  id: row.id,
  gradeId: row.grade_id,
  requestedBy: row.requested_by,
  currentScore: row.current_score,
  requestedScore: row.requested_score,
  reason: row.reason,
  status: row.status,
  reviewedBy: row.reviewed_by,
  reviewedAt: row.reviewed_at?.toISOString() ?? null,
  rejectionReason: row.rejection_reason,
  createdAt: row.created_at.toISOString(),
  ...(row.grade
    ? {
        studentName: row.grade.student.full_name,
        courseName: row.grade.medresa_course.course.name,
        medresaId: row.grade.medresa_course.medresa_id,
        examTypeName: row.grade.exam_type.name,
        teacherName: row.grade.teacher.full_name,
      }
    : {}),
});
