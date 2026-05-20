import type { Prisma } from "../../../prisma/generated/prisma/client";
import type { Gender, StudentStatus } from "../../../prisma/generated/prisma/enums";

type StudentCourseRow = {
  id: string;
  enrolled_at: Date;
  medresa_course: {
    id: string;
    course: { name: Prisma.JsonValue };
  };
};

type StudentListRow = {
  id: string;
  full_name: string;
  gender: Gender;
  guardian_phone: string;
  guardian_name: string;
  photo_url: string | null;
  status: StudentStatus;
  enrolled_at: Date;
  student_courses: StudentCourseRow[];
};

type TransferRow = {
  id: string;
  from_medresa_id: string;
  to_medresa_id: string;
  transfer_date: Date;
  reason: string | null;
  created_at: Date;
};

export const mapStudentCourseItem = (row: StudentCourseRow) => ({
  studentCourseId: row.id,
  medresaCourseId: row.medresa_course.id,
  courseName: row.medresa_course.course.name,
  enrolledAt: row.enrolled_at,
});

export const mapStudentListItem = (row: StudentListRow) => ({
  id: row.id,
  fullName: row.full_name,
  gender: row.gender,
  guardianPhone: row.guardian_phone,
  guardianName: row.guardian_name,
  photoUrl: row.photo_url,
  status: row.status,
  enrolledAt: row.enrolled_at,
  enrolledCourses: row.student_courses.map((sc) => ({
    studentCourseId: sc.id,
    medresaCourseId: sc.medresa_course.id,
    courseName: sc.medresa_course.course.name,
  })),
});

export type GradesSummaryDto = {
  overallGpaPercent: number | null;
  courseCount: number;
} | null;

export const mapStudentDetail = (
  row: StudentListRow & {
    date_of_birth: Date;
    address: string;
    current_medresa_id: string;
    current_medresa: { id: string; name: string };
    transfers: Array<
      TransferRow & {
        from_medresa?: { name: string };
        to_medresa?: { name: string };
      }
    >;
  },
  gradesSummary: GradesSummaryDto = null,
  feeStatus: {
    status: string;
    outstandingBalanceEtb: number;
    month: number;
    year: number;
  } | null = null
) => ({
  id: row.id,
  fullName: row.full_name,
  dateOfBirth: row.date_of_birth,
  gender: row.gender,
  address: row.address,
  guardianName: row.guardian_name,
  guardianPhone: row.guardian_phone,
  photoUrl: row.photo_url,
  status: row.status,
  enrolledAt: row.enrolled_at,
  currentMedresaId: row.current_medresa_id,
  currentMedresaName: row.current_medresa.name,
  courses: row.student_courses.map(mapStudentCourseItem),
  transferHistory: row.transfers.map((t) => ({
    id: t.id,
    fromMedresaId: t.from_medresa_id,
    toMedresaId: t.to_medresa_id,
    fromMedresaName: t.from_medresa?.name ?? null,
    toMedresaName: t.to_medresa?.name ?? null,
    transferDate: t.transfer_date,
    reason: t.reason,
    createdAt: t.created_at,
  })),
  attendanceSummary: null as { label: string } | null,
  gradesSummary,
  feeStatus,
});

export const mapTeacherStudentListItem = (row: {
  id: string;
  full_name: string;
  gender: Gender;
  photo_url: string | null;
  student_courses: StudentCourseRow[];
}) => ({
  id: row.id,
  fullName: row.full_name,
  gender: row.gender,
  photoUrl: row.photo_url,
  enrolledCourses: row.student_courses.map((sc) => ({
    medresaCourseId: sc.medresa_course.id,
    courseName: sc.medresa_course.course.name,
  })),
});
