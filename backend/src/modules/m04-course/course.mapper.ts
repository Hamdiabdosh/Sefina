import type { Prisma } from "../../../prisma/generated/prisma/client";
import type { CourseLevel, Status } from "../../../prisma/generated/prisma/enums";

type CourseRow = {
  id: string;
  name: Prisma.JsonValue;
  description: Prisma.JsonValue;
  level: CourseLevel;
  status: Status;
  created_at: Date;
  updated_at: Date;
  _count?: { medresa_courses: number };
};

export const mapCourseListItem = (course: CourseRow) => ({
  id: course.id,
  name: course.name,
  description: course.description,
  level: course.level,
  status: course.status,
  usedByCount: course._count?.medresa_courses ?? 0,
  createdAt: course.created_at,
  updatedAt: course.updated_at,
});

export const mapCourseDetail = (course: CourseRow) => ({
  id: course.id,
  name: course.name,
  description: course.description,
  level: course.level,
  status: course.status,
  usedByCount: course._count?.medresa_courses ?? 0,
  createdAt: course.created_at,
  updatedAt: course.updated_at,
});

type MedresaCourseListRow = {
  id: string;
  status: Status;
  activated_at: Date;
  course: {
    id: string;
    name: Prisma.JsonValue;
    description: Prisma.JsonValue;
    level: CourseLevel;
    status: Status;
  };
  assignments: Array<{
    id: string;
    assigned_since: Date;
    teacher: { id: string; user: { full_name: string } };
  }>;
  _count: { student_courses: number };
};

export const mapMedresaCourseListItem = (row: MedresaCourseListRow) => {
  const activeAssignment = row.assignments[0] ?? null;
  return {
    medresaCourseId: row.id,
    courseId: row.course.id,
    name: row.course.name,
    description: row.course.description,
    level: row.course.level,
    masterStatus: row.course.status,
    status: row.status,
    activatedAt: row.activated_at,
    assignedTeacher: activeAssignment
      ? {
          id: activeAssignment.teacher.id,
          fullName: activeAssignment.teacher.user.full_name,
          assignedSince: activeAssignment.assigned_since,
        }
      : null,
    studentCount: row._count.student_courses,
  };
};

type MedresaCourseDetailRow = MedresaCourseListRow & {
  medresa_id: string;
  medresa: { id: string; name: string };
};

export const mapMedresaCourseDetail = (row: MedresaCourseDetailRow) => ({
  ...mapMedresaCourseListItem(row),
  medresaId: row.medresa_id,
  medresaName: row.medresa.name,
  enrolledStudents: [] as Array<{ id: string; fullName: string }>,
});
