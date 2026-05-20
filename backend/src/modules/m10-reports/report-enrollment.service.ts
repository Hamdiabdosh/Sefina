import type { Request } from "express";
import { StudentStatus } from "../../../prisma/generated/prisma/enums";
import { toEthiopian } from "../../lib/ethiopian-calendar";
import { prisma } from "../../lib/prisma";
import { pickLocalizedName } from "./report.mapper";
import { assertMedresaReportAccess } from "./report-scope";
import type { ReportRangeQuery } from "./report.schema";

export const getEnrollmentReport = async (req: Request, query: ReportRangeQuery) => {
  const access = assertMedresaReportAccess(req, query.medresaId);
  if ("error" in access) return access;

  let medresaFilter: { current_medresa_id?: string | { in: string[] } } = {};
  if (req.user!.isSuperAdmin) {
    if (query.medresaId) medresaFilter = { current_medresa_id: query.medresaId };
  } else {
    const adminIds = (req.user!.medresaRoles ?? [])
      .filter((r) => r.role === "ADMIN")
      .map((r) => r.medresaId);
    if (query.medresaId) {
      if (!adminIds.includes(query.medresaId)) return { error: "FORBIDDEN" as const };
      medresaFilter = { current_medresa_id: query.medresaId };
    } else {
      medresaFilter = { current_medresa_id: { in: adminIds } };
    }
  }

  const statusFilter =
    query.status && query.status !== "ALL"
      ? { status: query.status as StudentStatus }
      : {};

  const students = await prisma.student.findMany({
    where: {
      deleted_at: null,
      ...medresaFilter,
      ...statusFilter,
    },
    include: {
      current_medresa: { select: { id: true, name: true } },
      student_courses: {
        where: { deleted_at: null },
        include: {
          medresa_course: {
            include: { course: { select: { name: true } } },
          },
        },
      },
      transfers: { orderBy: { transfer_date: "desc" }, take: 5 },
    },
    orderBy: { full_name: "asc" },
  });

  const items = students.map((s) => {
    const et = toEthiopian(
      s.enrolled_at.getUTCFullYear(),
      s.enrolled_at.getUTCMonth() + 1,
      s.enrolled_at.getUTCDate()
    );
    return {
      studentId: s.id,
      fullName: s.full_name,
      medresaId: s.current_medresa.id,
      medresaName: s.current_medresa.name,
      status: s.status,
      enrollmentEthiopian: { year: et.year, month: et.month, day: et.day },
      courses: s.student_courses.map((sc) => ({
        medresaCourseId: sc.medresa_course_id,
        courseName: pickLocalizedName(sc.medresa_course.course.name),
      })),
      transfers: s.transfers.map((t) => ({
        fromMedresaId: t.from_medresa_id,
        toMedresaId: t.to_medresa_id,
        transferDate: t.transfer_date.toISOString().slice(0, 10),
        reason: t.reason,
      })),
    };
  });

  return {
    fromMonth: query.fromMonth,
    fromYear: query.fromYear,
    toMonth: query.toMonth,
    toYear: query.toYear,
    items,
  };
};
