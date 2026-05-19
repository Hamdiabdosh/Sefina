import type { Prisma } from "../../../prisma/generated/prisma/client";
import type { Status } from "../../../prisma/generated/prisma/enums";

type TeacherWithAssignments = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  specialization: Prisma.JsonValue;
  date_joined: Date;
  photo_url: string | null;
  status: Status;
  created_at: Date;
  updated_at: Date;
  teacher_medresas: Array<{
    id: string;
    role: "TEACHER" | "ADMIN";
    assigned_since: Date;
    medresa: { id: string; name: string; status: Status };
  }>;
};

export const mapTeacherAssignment = (row: TeacherWithAssignments["teacher_medresas"][0]) => ({
  id: row.id,
  medresaId: row.medresa.id,
  medresaName: row.medresa.name,
  medresaStatus: row.medresa.status,
  role: row.role,
  assignedSince: row.assigned_since,
});

export const mapTeacherDetail = (teacher: TeacherWithAssignments) => ({
  id: teacher.id,
  userId: teacher.user_id,
  fullName: teacher.full_name,
  phone: teacher.phone,
  email: teacher.email,
  specialization: teacher.specialization,
  dateJoined: teacher.date_joined,
  photoUrl: teacher.photo_url,
  status: teacher.status,
  createdAt: teacher.created_at,
  updatedAt: teacher.updated_at,
  medresaAssignments: teacher.teacher_medresas.map(mapTeacherAssignment),
});

export const mapTeacherListItem = (teacher: TeacherWithAssignments) => ({
  id: teacher.id,
  fullName: teacher.full_name,
  phone: teacher.phone,
  email: teacher.email,
  specialization: teacher.specialization,
  dateJoined: teacher.date_joined,
  photoUrl: teacher.photo_url,
  status: teacher.status,
  medresaAssignments: teacher.teacher_medresas.map(mapTeacherAssignment),
});

export const teacherInclude = {
  teacher_medresas: {
    where: { deleted_at: null },
    include: {
      medresa: { select: { id: true, name: true, status: true } },
    },
    orderBy: { assigned_since: "desc" as const },
  },
} satisfies Prisma.TeacherInclude;
