import type { Request } from "express";
import { Prisma } from "../../../prisma/generated/prisma/client";
import { AuditAction, Status, StudentStatus } from "../../../prisma/generated/prisma/enums";
import { auditLog } from "../../lib/audit";
import { assertMedresaActive, activeMedresaWhere } from "../../lib/medresa-scope";
import { prisma } from "../../lib/prisma";
import {
  deleteStudentPhotoFile,
  saveStudentPhoto,
} from "../../lib/student-photo";
import {
  canReadStudent,
  canWriteStudent,
  courseEligibleForEnrollment,
  loadStudentForAccess,
} from "../../lib/student-scope";
import {
  mapStudentDetail,
  mapStudentListItem,
  mapTeacherStudentListItem,
} from "./student.mapper";
import type {
  AssignStudentCourseInput,
  CreateStudentInput,
  ListStudentsQuery,
  TransferStudentInput,
  UpdateStudentInput,
} from "./student.schema";

const studentListInclude = {
  student_courses: {
    where: { deleted_at: null },
    select: {
      id: true,
      enrolled_at: true,
      medresa_course: {
        select: {
          id: true,
          course: { select: { name: true } },
        },
      },
    },
  },
} as const;

const studentDetailInclude = {
  ...studentListInclude,
  current_medresa: { select: { id: true, name: true } },
  transfers: {
    orderBy: { created_at: "desc" as const },
    select: {
      id: true,
      from_medresa_id: true,
      to_medresa_id: true,
      transfer_date: true,
      reason: true,
      created_at: true,
    },
  },
} as const;

const enrichStudentDetail = async (
  student: Prisma.StudentGetPayload<{ include: typeof studentDetailInclude }>
) => {
  const medresaIds = [
    ...new Set(student.transfers.flatMap((t) => [t.from_medresa_id, t.to_medresa_id])),
  ];
  const medresas =
    medresaIds.length > 0
      ? await prisma.medresa.findMany({
          where: { id: { in: medresaIds } },
          select: { id: true, name: true },
        })
      : [];
  const nameById = new Map(medresas.map((m) => [m.id, m.name]));

  return mapStudentDetail({
    ...student,
    transfers: student.transfers.map((t) => ({
      ...t,
      from_medresa: { name: nameById.get(t.from_medresa_id) ?? "" },
      to_medresa: { name: nameById.get(t.to_medresa_id) ?? "" },
    })),
  });
};

export const listStudentsByMedresa = async (
  medresaId: string,
  query: ListStudentsQuery
) => {
  const medresaActive = await assertMedresaActive(medresaId);
  if (!medresaActive) return { error: "MEDRESA_INACTIVE" as const };

  const { page, limit, search, gender, status, medresaCourseId } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.StudentWhereInput = {
    deleted_at: null,
    current_medresa_id: medresaId,
    ...(gender ? { gender } : {}),
    ...(status ? { status } : {}),
    ...(medresaCourseId
      ? {
          student_courses: {
            some: { medresa_course_id: medresaCourseId, deleted_at: null },
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { full_name: { contains: search, mode: "insensitive" } },
            { guardian_name: { contains: search, mode: "insensitive" } },
            { guardian_phone: { contains: search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      orderBy: { enrolled_at: "desc" },
      include: studentListInclude,
    }),
    prisma.student.count({ where }),
  ]);

  return {
    items: items.map(mapStudentListItem),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createStudent = async (
  medresaId: string,
  input: CreateStudentInput,
  performedBy: string,
  photoFile?: Express.Multer.File
) => {
  const medresaActive = await assertMedresaActive(medresaId);
  if (!medresaActive) return { error: "MEDRESA_INACTIVE" as const };

  let photoUrl: string | null = null;
  if (photoFile) {
    photoUrl = await saveStudentPhoto(photoFile);
  }

  const student = await prisma.student.create({
    data: {
      full_name: input.fullName,
      date_of_birth: input.dateOfBirth,
      gender: input.gender,
      address: input.address,
      guardian_name: input.guardianName,
      guardian_phone: input.guardianPhone,
      photo_url: photoUrl,
      current_medresa_id: medresaId,
      status: StudentStatus.ACTIVE,
    },
    include: studentDetailInclude,
  });

  await auditLog({
    tableName: "Student",
    recordId: student.id,
    action: AuditAction.INSERT,
    performedBy,
    newValues: { medresaId, fullName: input.fullName },
  });

  return { student: await enrichStudentDetail(student) };
};

export const getStudentDetail = async (req: Request, studentId: string) => {
  const accessRow = await loadStudentForAccess(studentId);
  if (!accessRow) return { error: "STUDENT_NOT_FOUND" as const };

  const allowed = await canReadStudent(req, accessRow);
  if (!allowed) return { error: "FORBIDDEN" as const };

  const student = await prisma.student.findFirst({
    where: { id: studentId, deleted_at: null },
    include: studentDetailInclude,
  });

  if (!student) return { error: "STUDENT_NOT_FOUND" as const };

  return { student: await enrichStudentDetail(student) };
};

export const updateStudent = async (
  req: Request,
  studentId: string,
  input: UpdateStudentInput,
  performedBy: string,
  photoFile?: Express.Multer.File
) => {
  const accessRow = await loadStudentForAccess(studentId);
  if (!accessRow) return { error: "STUDENT_NOT_FOUND" as const };

  if (!canWriteStudent(req, accessRow.current_medresa_id)) {
    return { error: "FORBIDDEN" as const };
  }

  const existing = await prisma.student.findFirst({
    where: { id: studentId, deleted_at: null },
  });
  if (!existing) return { error: "STUDENT_NOT_FOUND" as const };

  let photoUrl = existing.photo_url;
  if (photoFile) {
    await deleteStudentPhotoFile(existing.photo_url);
    photoUrl = await saveStudentPhoto(photoFile);
  }

  const student = await prisma.student.update({
    where: { id: studentId },
    data: {
      ...(input.fullName !== undefined ? { full_name: input.fullName } : {}),
      ...(input.dateOfBirth !== undefined ? { date_of_birth: input.dateOfBirth } : {}),
      ...(input.gender !== undefined ? { gender: input.gender } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.guardianName !== undefined ? { guardian_name: input.guardianName } : {}),
      ...(input.guardianPhone !== undefined ? { guardian_phone: input.guardianPhone } : {}),
      ...(photoFile ? { photo_url: photoUrl } : {}),
    },
    include: studentDetailInclude,
  });

  await auditLog({
    tableName: "Student",
    recordId: studentId,
    action: AuditAction.UPDATE,
    performedBy,
    newValues: input as Record<string, unknown>,
  });

  return { student: await enrichStudentDetail(student) };
};

export const getStudentPhotoPath = async (studentId: string) =>
  prisma.student.findFirst({
    where: { id: studentId, deleted_at: null },
    select: { photo_url: true, current_medresa_id: true, id: true },
  });

export const assignStudentToCourse = async (
  req: Request,
  studentId: string,
  input: AssignStudentCourseInput,
  performedBy: string
) => {
  const accessRow = await loadStudentForAccess(studentId);
  if (!accessRow) return { error: "STUDENT_NOT_FOUND" as const };

  if (!canWriteStudent(req, accessRow.current_medresa_id)) {
    return { error: "FORBIDDEN" as const };
  }

  if (accessRow.status !== StudentStatus.ACTIVE) {
    return { error: "STUDENT_NOT_ACTIVE" as const };
  }

  const eligibility = await courseEligibleForEnrollment(
    input.medresaCourseId,
    accessRow.current_medresa_id
  );
  if (!eligibility.eligible) {
    return { error: eligibility.error };
  }

  const existing = await prisma.studentCourse.findUnique({
    where: {
      student_id_medresa_course_id: {
        student_id: studentId,
        medresa_course_id: input.medresaCourseId,
      },
    },
  });

  let studentCourse;
  if (existing) {
    if (existing.deleted_at === null) {
      return { error: "ALREADY_ENROLLED" as const };
    }
    studentCourse = await prisma.studentCourse.update({
      where: { id: existing.id },
      data: { deleted_at: null, enrolled_at: new Date() },
      include: {
        medresa_course: {
          select: { id: true, course: { select: { name: true } } },
        },
      },
    });
  } else {
    studentCourse = await prisma.studentCourse.create({
      data: {
        student_id: studentId,
        medresa_course_id: input.medresaCourseId,
      },
      include: {
        medresa_course: {
          select: { id: true, course: { select: { name: true } } },
        },
      },
    });
  }

  await auditLog({
    tableName: "StudentCourse",
    recordId: studentCourse.id,
    action: AuditAction.INSERT,
    performedBy,
    newValues: { studentId, medresaCourseId: input.medresaCourseId },
  });

  return {
    enrollment: {
      studentCourseId: studentCourse.id,
      medresaCourseId: studentCourse.medresa_course.id,
      courseName: studentCourse.medresa_course.course.name,
      enrolledAt: studentCourse.enrolled_at,
    },
  };
};

export const removeStudentFromCourse = async (
  req: Request,
  studentId: string,
  studentCourseId: string,
  performedBy: string
) => {
  const accessRow = await loadStudentForAccess(studentId);
  if (!accessRow) return { error: "STUDENT_NOT_FOUND" as const };

  if (!canWriteStudent(req, accessRow.current_medresa_id)) {
    return { error: "FORBIDDEN" as const };
  }

  const enrollment = await prisma.studentCourse.findFirst({
    where: {
      id: studentCourseId,
      student_id: studentId,
      deleted_at: null,
      medresa_course: { medresa_id: accessRow.current_medresa_id },
    },
  });

  if (!enrollment) return { error: "ENROLLMENT_NOT_FOUND" as const };

  await prisma.studentCourse.update({
    where: { id: studentCourseId },
    data: { deleted_at: new Date() },
  });

  await auditLog({
    tableName: "StudentCourse",
    recordId: studentCourseId,
    action: AuditAction.SOFT_DELETE,
    performedBy,
    newValues: { studentId },
  });

  return { success: true };
};

export const transferStudent = async (
  req: Request,
  studentId: string,
  input: TransferStudentInput,
  performedBy: string
) => {
  const accessRow = await loadStudentForAccess(studentId);
  if (!accessRow) return { error: "STUDENT_NOT_FOUND" as const };

  if (!canWriteStudent(req, accessRow.current_medresa_id)) {
    return { error: "FORBIDDEN" as const };
  }

  const fromMedresaId = accessRow.current_medresa_id;
  if (input.toMedresaId === fromMedresaId) {
    return { error: "SAME_MEDRESA" as const };
  }

  const destActive = await assertMedresaActive(input.toMedresaId);
  if (!destActive) return { error: "MEDRESA_INACTIVE" as const };

  const student = await prisma.$transaction(async (tx) => {
    await tx.studentCourse.updateMany({
      where: { student_id: studentId, deleted_at: null },
      data: { deleted_at: new Date() },
    });

    await tx.studentTransfer.create({
      data: {
        student_id: studentId,
        from_medresa_id: fromMedresaId,
        to_medresa_id: input.toMedresaId,
        transfer_date: input.transferDate,
        reason: input.reason ?? null,
      },
    });

    return tx.student.update({
      where: { id: studentId },
      data: {
        current_medresa_id: input.toMedresaId,
        status: StudentStatus.ACTIVE,
      },
      include: studentDetailInclude,
    });
  });

  await auditLog({
    tableName: "Student",
    recordId: studentId,
    action: AuditAction.UPDATE,
    performedBy,
    newValues: {
      event: "TRANSFER",
      fromMedresaId,
      toMedresaId: input.toMedresaId,
    },
  });

  return { student: await enrichStudentDetail(student) };
};

export const listTeacherStudents = async (userId: string) => {
  const teacher = await prisma.teacher.findFirst({
    where: { user_id: userId, deleted_at: null, status: Status.ACTIVE },
    select: { id: true },
  });
  if (!teacher) return { items: [] };

  const medresaCourseIds = await prisma.courseAssignment.findMany({
    where: { teacher_id: teacher.id, deleted_at: null },
    select: { medresa_course_id: true },
  });

  const courseIds = medresaCourseIds.map((r) => r.medresa_course_id);
  if (courseIds.length === 0) return { items: [] };

  const enrollments = await prisma.studentCourse.findMany({
    where: {
      deleted_at: null,
      medresa_course_id: { in: courseIds },
      student: { deleted_at: null, status: StudentStatus.ACTIVE },
    },
    select: { student_id: true },
    distinct: ["student_id"],
  });

  const studentIds = enrollments.map((e) => e.student_id);
  if (studentIds.length === 0) return { items: [] };

  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, deleted_at: null },
    orderBy: { full_name: "asc" },
    include: {
      student_courses: {
        where: {
          deleted_at: null,
          medresa_course_id: { in: courseIds },
        },
        select: {
          id: true,
          enrolled_at: true,
          medresa_course: {
            select: {
              id: true,
              course: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  return { items: students.map(mapTeacherStudentListItem) };
};

export const listTransferDestinations = async (excludeMedresaId?: string) => {
  const medresas = await prisma.medresa.findMany({
    where: {
      ...activeMedresaWhere(),
      ...(excludeMedresaId ? { id: { not: excludeMedresaId } } : {}),
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return {
    items: medresas.map((m) => ({ id: m.id, name: m.name })),
  };
};

export const assertStudentPhotoAccess = async (
  req: Request,
  studentId: string
): Promise<{ photoUrl: string } | { error: string }> => {
  const row = await loadStudentForAccess(studentId);
  if (!row || !row.photo_url) return { error: "NOT_FOUND" };

  const allowed = await canReadStudent(req, row);
  if (!allowed) return { error: "FORBIDDEN" };

  return { photoUrl: row.photo_url };
};
