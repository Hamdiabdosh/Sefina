import type { Prisma } from "../../../prisma/generated/prisma/client";
import { AuditAction, Status } from "../../../prisma/generated/prisma/enums";
import { auditLog } from "../../lib/audit";
import { prisma } from "../../lib/prisma";
import { mapCourseDetail, mapCourseListItem } from "./course.mapper";
import type {
  CreateCourseInput,
  ListCoursesQuery,
  UpdateCourseInput,
} from "./course.schema";

type LocalizedName = { en: string; am?: string; ar?: string };

const normalizeNameEn = (name: LocalizedName): string =>
  name.en.trim().toLowerCase();

const getNameEnFromJson = (value: Prisma.JsonValue): string | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const en = (value as LocalizedName).en;
  return typeof en === "string" ? en : null;
};

export const findCourseNameConflict = async (
  nameEn: string,
  excludeId?: string
): Promise<boolean> => {
  const normalized = nameEn.trim().toLowerCase();
  const courses = await prisma.course.findMany({
    where: { deleted_at: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true, name: true },
  });

  return courses.some((course) => {
    const existing = getNameEnFromJson(course.name);
    return existing !== null && existing.trim().toLowerCase() === normalized;
  });
};

const courseListInclude = {
  _count: {
    select: {
      medresa_courses: {
        where: { deleted_at: null, status: Status.ACTIVE },
      },
    },
  },
} as const;

export const listCourses = async (query: ListCoursesQuery) => {
  const { page, limit, level, status } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.CourseWhereInput = {
    deleted_at: null,
    ...(level ? { level } : {}),
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      include: courseListInclude,
    }),
    prisma.course.count({ where }),
  ]);

  return {
    items: items.map(mapCourseListItem),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getCourseById = async (id: string) => {
  const course = await prisma.course.findFirst({
    where: { id, deleted_at: null },
    include: courseListInclude,
  });
  return course ? mapCourseDetail(course) : null;
};

export const createCourse = async (input: CreateCourseInput, performedBy: string) => {
  const conflict = await findCourseNameConflict(input.name.en);
  if (conflict) return { error: "DUPLICATE_COURSE_NAME" as const };

  const course = await prisma.course.create({
    data: {
      name: input.name,
      description: input.description,
      level: input.level,
      status: input.status ?? Status.ACTIVE,
    },
    include: courseListInclude,
  });

  await auditLog({
    tableName: "Course",
    recordId: course.id,
    action: AuditAction.INSERT,
    performedBy,
    newValues: { name: normalizeNameEn(input.name), level: input.level },
  });

  return { course: mapCourseDetail(course) };
};

export const updateCourse = async (
  id: string,
  input: UpdateCourseInput,
  performedBy: string
) => {
  const existing = await prisma.course.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) return { error: "COURSE_NOT_FOUND" as const };

  if (input.name) {
    const conflict = await findCourseNameConflict(input.name.en, id);
    if (conflict) return { error: "DUPLICATE_COURSE_NAME" as const };
  }

  const course = await prisma.course.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.level !== undefined ? { level: input.level } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
    include: courseListInclude,
  });

  await auditLog({
    tableName: "Course",
    recordId: id,
    action: AuditAction.UPDATE,
    performedBy,
    newValues: input,
  });

  return { course: mapCourseDetail(course) };
};

export const deactivateCourse = async (id: string, performedBy: string) => {
  const existing = await prisma.course.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) return { error: "COURSE_NOT_FOUND" as const };

  const course = await prisma.course.update({
    where: { id },
    data: {
      status: Status.INACTIVE,
      deleted_at: new Date(),
    },
    include: courseListInclude,
  });

  await auditLog({
    tableName: "Course",
    recordId: id,
    action: AuditAction.SOFT_DELETE,
    performedBy,
    newValues: { status: Status.INACTIVE },
  });

  return { course: mapCourseDetail(course) };
};

export const reactivateCourse = async (id: string, performedBy: string) => {
  const existing = await prisma.course.findFirst({ where: { id } });
  if (!existing) return { error: "COURSE_NOT_FOUND" as const };

  const course = await prisma.course.update({
    where: { id },
    data: {
      status: Status.ACTIVE,
      deleted_at: null,
    },
    include: courseListInclude,
  });

  await auditLog({
    tableName: "Course",
    recordId: id,
    action: AuditAction.UPDATE,
    performedBy,
    newValues: { event: "REACTIVATE", status: Status.ACTIVE },
  });

  return { course: mapCourseDetail(course) };
};
