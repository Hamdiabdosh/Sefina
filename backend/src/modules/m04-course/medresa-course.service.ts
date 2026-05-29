import { AuditAction, Status } from "../../../prisma/generated/prisma/enums";
import { auditLog } from "../../lib/audit";
import { assertMedresaActive } from "../../lib/medresa-scope";
import { prisma } from "../../lib/prisma";
import { mapMedresaCourseDetail, mapMedresaCourseListItem } from "./course.mapper";
import type {
  ActivateMedresaCourseInput,
  ListMedresaCoursesQuery,
} from "./course.schema";
import { teacherCanAccessMedresaCourse } from "../../lib/course-access";

const medresaCourseListInclude = {
  course: {
    select: {
      id: true,
      name: true,
      description: true,
      level: true,
      status: true,
    },
  },
  assignments: {
    where: { deleted_at: null },
    take: 1,
    orderBy: { assigned_since: "desc" as const },
    select: {
      id: true,
      assigned_since: true,
      teacher: { select: { id: true, user: { select: { full_name: true } } } },
    },
  },
  _count: {
    select: {
      student_courses: {
        where: { deleted_at: null },
      },
    },
  },
} as const;

export const listAvailableMasterCourses = async (medresaId: string) => {
  const medresaActive = await assertMedresaActive(medresaId);
  if (!medresaActive) return { error: "MEDRESA_INACTIVE" as const };

  const activatedCourseIds = await prisma.medresaCourse.findMany({
    where: {
      medresa_id: medresaId,
      deleted_at: null,
      status: Status.ACTIVE,
    },
    select: { course_id: true },
  });

  const excludeIds = activatedCourseIds.map((r) => r.course_id);

  const courses = await prisma.course.findMany({
    where: {
      deleted_at: null,
      status: Status.ACTIVE,
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      level: true,
    },
  });

  return {
    items: courses.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      level: c.level,
    })),
  };
};

export const listTeachersForMedresaAssignment = async (medresaId: string) => {
  const medresaActive = await assertMedresaActive(medresaId);
  if (!medresaActive) return { error: "MEDRESA_INACTIVE" as const };

  const rows = await prisma.teacherMedresa.findMany({
    where: {
      medresa_id: medresaId,
      deleted_at: null,
      teacher: { deleted_at: null, status: Status.ACTIVE },
    },
    select: {
      teacher: {
        select: { id: true, user: { select: { full_name: true, email: true } } },
      },
    },
    orderBy: { teacher: { user: { full_name: "asc" } } },
  });

  return {
    items: rows.map((row) => ({
      id: row.teacher.id,
      fullName: row.teacher.user.full_name,
      email: row.teacher.user.email,
    })),
  };
};

export const listMedresaCourses = async (
  medresaId: string,
  query: ListMedresaCoursesQuery
) => {
  const medresaActive = await assertMedresaActive(medresaId);
  if (!medresaActive) return { error: "MEDRESA_INACTIVE" as const };

  const { level, status, teacherId } = query;

  const rows = await prisma.medresaCourse.findMany({
    where: {
      medresa_id: medresaId,
      deleted_at: null,
      ...(status ? { status } : {}),
      ...(level ? { course: { level } } : {}),
      ...(teacherId
        ? {
            assignments: {
              some: {
                teacher_id: teacherId,
                deleted_at: null,
              },
            },
          }
        : {}),
    },
    orderBy: { activated_at: "desc" },
    include: medresaCourseListInclude,
  });

  return { items: rows.map(mapMedresaCourseListItem) };
};

export const activateCourseInMedresa = async (
  medresaId: string,
  input: ActivateMedresaCourseInput,
  performedBy: string
) => {
  const medresaActive = await assertMedresaActive(medresaId);
  if (!medresaActive) return { error: "MEDRESA_INACTIVE" as const };

  const masterCourse = await prisma.course.findFirst({
    where: {
      id: input.courseId,
      deleted_at: null,
      status: Status.ACTIVE,
    },
  });
  if (!masterCourse) return { error: "COURSE_NOT_FOUND" as const };

  const existing = await prisma.medresaCourse.findUnique({
    where: {
      medresa_id_course_id: {
        medresa_id: medresaId,
        course_id: input.courseId,
      },
    },
  });

  let medresaCourse;
  if (existing) {
    medresaCourse = await prisma.medresaCourse.update({
      where: { id: existing.id },
      data: {
        status: Status.ACTIVE,
        deleted_at: null,
        activated_at: new Date(),
      },
      include: medresaCourseListInclude,
    });
  } else {
    medresaCourse = await prisma.medresaCourse.create({
      data: {
        medresa_id: medresaId,
        course_id: input.courseId,
        status: Status.ACTIVE,
      },
      include: medresaCourseListInclude,
    });
  }

  await auditLog({
    tableName: "MedresaCourse",
    recordId: medresaCourse.id,
    action: existing ? AuditAction.UPDATE : AuditAction.INSERT,
    performedBy,
    newValues: { medresaId, courseId: input.courseId, event: "ACTIVATE" },
  });

  return { item: mapMedresaCourseListItem(medresaCourse) };
};

export const deactivateMedresaCourse = async (
  medresaId: string,
  medresaCourseId: string,
  performedBy: string
) => {
  const existing = await prisma.medresaCourse.findFirst({
    where: {
      id: medresaCourseId,
      medresa_id: medresaId,
      deleted_at: null,
    },
  });
  if (!existing) return { error: "MEDRESA_COURSE_NOT_FOUND" as const };

  const medresaCourse = await prisma.medresaCourse.update({
    where: { id: medresaCourseId },
    data: { status: Status.INACTIVE },
    include: medresaCourseListInclude,
  });

  await auditLog({
    tableName: "MedresaCourse",
    recordId: medresaCourseId,
    action: AuditAction.UPDATE,
    performedBy,
    newValues: { medresaId, event: "DEACTIVATE", status: Status.INACTIVE },
  });

  return { item: mapMedresaCourseListItem(medresaCourse) };
};

export const getMedresaCourseDetail = async (
  medresaId: string,
  medresaCourseId: string,
  options: { userId: string; isSuperAdmin: boolean; isMedresaAdmin: boolean }
) => {
  const row = await prisma.medresaCourse.findFirst({
    where: {
      id: medresaCourseId,
      medresa_id: medresaId,
      deleted_at: null,
    },
    include: {
      ...medresaCourseListInclude,
      medresa: { select: { id: true, name: true } },
    },
  });

  if (!row) return { error: "MEDRESA_COURSE_NOT_FOUND" as const };

  if (!options.isSuperAdmin && !options.isMedresaAdmin) {
    const canAccess = await teacherCanAccessMedresaCourse(
      options.userId,
      medresaCourseId,
      medresaId
    );
    if (!canAccess) return { error: "FORBIDDEN" as const };
  }

  return { item: mapMedresaCourseDetail(row) };
};
