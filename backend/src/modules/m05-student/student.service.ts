import type { Request } from "express";
import { Prisma } from "../../../prisma/generated/prisma/client";
import {
  AuditAction,
  EnrollmentEndReason,
  MedresaRole,
  Status,
  StudentStatus,
} from "../../../prisma/generated/prisma/enums";
import { auditLog, getClientIp } from "../../lib/audit";
import { assertMedresaActive, activeMedresaWhere } from "../../lib/medresa-scope";
import { prisma } from "../../lib/prisma";
import { findDuplicateStudent } from "../../lib/student-duplicate";
import { generateEnrollmentNumber } from "../../lib/student-enrollment-number";
import {
  closeOpenEnrollmentPeriod,
  openEnrollmentPeriod,
} from "../../lib/student-enrollment-period";
import {
  deleteStudentPhotoFile,
  saveStudentPhoto,
} from "../../lib/student-photo";
import { studentListWhere } from "../../lib/student-search";
import {
  canReadStudent,
  canWriteStudent,
  courseEligibleForEnrollment,
  hasMedresaAdminRole,
  loadStudentForAccess,
} from "../../lib/student-scope";
import { buildStudentResultsPayload } from "../m07-grades/grade-results.service";
import { getStudentFeeStatusSummary } from "../m08-fees/fee-ledger.service";
import { isTeacherOnly } from "../../lib/fee-scope";
import {
  mapStudentDetail,
  mapStudentListItem,
  mapTeacherStudentListItem,
} from "./student.mapper";
import type {
  AssignStudentCourseInput,
  CreateStudentInput,
  GraduateStudentInput,
  ListStudentsQuery,
  ReactivateStudentInput,
  TransferStudentInput,
  UpdateStudentInput,
  WithdrawStudentInput,
} from "./student.schema";

const auditStudent = async (
  input: Parameters<typeof auditLog>[0],
  req?: Request
): Promise<void> =>
  auditLog({
    ...input,
    ip: req ? (getClientIp(req) ?? null) : (input.ip ?? null),
  });

const softDeleteActiveEnrollments = async (
  tx: Prisma.TransactionClient,
  studentId: string
) =>
  tx.studentCourse.updateMany({
    where: { student_id: studentId, deleted_at: null },
    data: { deleted_at: new Date() },
  });

const studentProfileFields = (input: CreateStudentInput | UpdateStudentInput) => ({
  ...(input.fullName !== undefined ? { full_name: input.fullName } : {}),
  ...(input.dateOfBirth !== undefined ? { date_of_birth: input.dateOfBirth } : {}),
  ...(input.gender !== undefined ? { gender: input.gender } : {}),
  ...(input.address !== undefined ? { address: input.address } : {}),
  ...(input.guardianName !== undefined ? { guardian_name: input.guardianName } : {}),
  ...(input.guardianPhone !== undefined ? { guardian_phone: input.guardianPhone } : {}),
  ...(input.secondaryGuardianName !== undefined
    ? { secondary_guardian_name: input.secondaryGuardianName ?? null }
    : {}),
  ...(input.secondaryGuardianPhone !== undefined
    ? { secondary_guardian_phone: input.secondaryGuardianPhone ?? null }
    : {}),
  ...(input.nationalId !== undefined ? { national_id: input.nationalId ?? null } : {}),
  ...(input.bloodGroup !== undefined ? { blood_group: input.bloodGroup ?? null } : {}),
  ...(input.allergies !== undefined ? { allergies: input.allergies ?? null } : {}),
  ...(input.enrollmentNumber !== undefined
    ? { enrollment_number: input.enrollmentNumber ?? null }
    : {}),
});

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
      from_medresa: { select: { name: true } },
      to_medresa: { select: { name: true } },
    },
  },
} as const;

const enrichStudentDetail = async (
  student: Prisma.StudentGetPayload<{ include: typeof studentDetailInclude }>,
  req?: Request
) => {
  const results = await buildStudentResultsPayload(student.id);
  const gradesSummary = results
    ? {
        overallGpaPercent: results.overallGpaPercent,
        courseCount: results.courses.length,
      }
    : null;

  let feeStatus = null;
  if (req && !isTeacherOnly(req)) {
    feeStatus = await getStudentFeeStatusSummary(student.id, student.current_medresa_id);
  }

  return mapStudentDetail(student, gradesSummary, feeStatus);
};

export const listStudentsByMedresa = async (
  medresaId: string,
  query: ListStudentsQuery
) => {
  const medresaActive = await assertMedresaActive(medresaId);
  if (!medresaActive) return { error: "MEDRESA_INACTIVE" as const };

  const { page, limit, search, gender, status, medresaCourseId } = query;
  const skip = (page - 1) * limit;

  const where = studentListWhere(medresaId, {
    search,
    gender,
    status,
    medresaCourseId,
  });

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
  photoFile?: Express.Multer.File,
  req?: Request
) => {
  const medresaActive = await assertMedresaActive(medresaId);
  if (!medresaActive) return { error: "MEDRESA_INACTIVE" as const };

  const duplicate = await findDuplicateStudent(
    medresaId,
    input.fullName,
    input.dateOfBirth
  );
  if (duplicate) return { error: "DUPLICATE_STUDENT" as const };

  let enrollmentNumber = input.enrollmentNumber ?? null;
  if (enrollmentNumber) {
    const taken = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Student"
      WHERE current_medresa_id = ${medresaId}::uuid
        AND enrollment_number = ${enrollmentNumber}
        AND deleted_at IS NULL
      LIMIT 1
    `;
    if (taken.length > 0) return { error: "DUPLICATE_ENROLLMENT_NUMBER" as const };
  } else {
    enrollmentNumber = await generateEnrollmentNumber(medresaId);
  }

  let photoUrl: string | null = null;
  if (photoFile) {
    photoUrl = await saveStudentPhoto(photoFile);
  }

  let student;
  try {
    student = await prisma.$transaction(async (tx) => {
      const row = await tx.student.create({
        data: {
          full_name: input.fullName,
          date_of_birth: input.dateOfBirth,
          gender: input.gender,
          address: input.address,
          guardian_name: input.guardianName,
          guardian_phone: input.guardianPhone,
          secondary_guardian_name: input.secondaryGuardianName ?? null,
          secondary_guardian_phone: input.secondaryGuardianPhone ?? null,
          national_id: input.nationalId ?? null,
          blood_group: input.bloodGroup ?? null,
          allergies: input.allergies ?? null,
          enrollment_number: enrollmentNumber,
          photo_url: photoUrl,
          current_medresa_id: medresaId,
          status: StudentStatus.ACTIVE,
        } as Prisma.StudentUncheckedCreateInput,
        include: studentDetailInclude,
      });
      await openEnrollmentPeriod(tx, row.id, medresaId);
      return row;
    });
  } catch (err) {
    if (photoUrl) await deleteStudentPhotoFile(photoUrl);
    throw err;
  }

  await auditStudent(
    {
      tableName: "Student",
      recordId: student.id,
      action: AuditAction.INSERT,
      performedBy,
      newValues: { medresaId, fullName: input.fullName, enrollmentNumber },
    },
    req
  );

  return { student: await enrichStudentDetail(student, req) };
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

  return { student: await enrichStudentDetail(student, req) };
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

  if (input.fullName !== undefined && input.dateOfBirth !== undefined) {
    const duplicate = await findDuplicateStudent(
      accessRow.current_medresa_id,
      input.fullName,
      input.dateOfBirth,
      studentId
    );
    if (duplicate) return { error: "DUPLICATE_STUDENT" as const };
  } else if (input.fullName !== undefined) {
    const duplicate = await findDuplicateStudent(
      accessRow.current_medresa_id,
      input.fullName,
      existing.date_of_birth,
      studentId
    );
    if (duplicate) return { error: "DUPLICATE_STUDENT" as const };
  } else if (input.dateOfBirth !== undefined) {
    const duplicate = await findDuplicateStudent(
      accessRow.current_medresa_id,
      existing.full_name,
      input.dateOfBirth,
      studentId
    );
    if (duplicate) return { error: "DUPLICATE_STUDENT" as const };
  }

  if (input.enrollmentNumber !== undefined && input.enrollmentNumber !== null) {
    const taken = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Student"
      WHERE current_medresa_id = ${accessRow.current_medresa_id}::uuid
        AND enrollment_number = ${input.enrollmentNumber}
        AND deleted_at IS NULL
        AND id <> ${studentId}::uuid
      LIMIT 1
    `;
    if (taken.length > 0) return { error: "DUPLICATE_ENROLLMENT_NUMBER" as const };
  }

  const oldPhotoUrl = existing.photo_url;
  let newPhotoUrl: string | null = null;
  if (photoFile) {
    newPhotoUrl = await saveStudentPhoto(photoFile);
  }

  let student;
  try {
    student = await prisma.student.update({
      where: { id: studentId },
      data: {
        ...studentProfileFields(input),
        ...(newPhotoUrl ? { photo_url: newPhotoUrl } : {}),
      } as Prisma.StudentUncheckedUpdateInput,
      include: studentDetailInclude,
    });
    if (newPhotoUrl && oldPhotoUrl) {
      await deleteStudentPhotoFile(oldPhotoUrl);
    }
  } catch (err) {
    if (newPhotoUrl) await deleteStudentPhotoFile(newPhotoUrl);
    throw err;
  }

  await auditStudent(
    {
      tableName: "Student",
      recordId: studentId,
      action: AuditAction.UPDATE,
      performedBy,
      newValues: input as Record<string, unknown>,
    },
    req
  );

  return { student: await enrichStudentDetail(student, req) };
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

  await auditStudent(
    {
      tableName: "StudentCourse",
      recordId: studentCourse.id,
      action: AuditAction.INSERT,
      performedBy,
      newValues: { studentId, medresaCourseId: input.medresaCourseId },
    },
    req
  );

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

  await auditStudent(
    {
      tableName: "StudentCourse",
      recordId: studentCourseId,
      action: AuditAction.SOFT_DELETE,
      performedBy,
      newValues: { studentId },
    },
    req
  );

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

  if (accessRow.status !== StudentStatus.ACTIVE) {
    return { error: "STUDENT_NOT_ACTIVE" as const };
  }

  const student = await prisma.$transaction(async (tx) => {
    await softDeleteActiveEnrollments(tx, studentId);

    await closeOpenEnrollmentPeriod(
      tx,
      studentId,
      fromMedresaId,
      EnrollmentEndReason.TRANSFERRED,
      input.transferDate
    );

    await tx.studentTransfer.create({
      data: {
        student_id: studentId,
        from_medresa_id: fromMedresaId,
        to_medresa_id: input.toMedresaId,
        transfer_date: input.transferDate,
        reason: input.reason ?? null,
      },
    });

    const row = await tx.student.update({
      where: { id: studentId },
      data: {
        current_medresa_id: input.toMedresaId,
        status: StudentStatus.ACTIVE,
        withdrawn_at: null,
        graduated_at: null,
      } as Prisma.StudentUncheckedUpdateInput,
      include: studentDetailInclude,
    });

    await openEnrollmentPeriod(tx, studentId, input.toMedresaId, input.transferDate);
    return row;
  });

  await auditStudent(
    {
      tableName: "Student",
      recordId: studentId,
      action: AuditAction.UPDATE,
      performedBy,
      newValues: {
        event: "TRANSFER",
        fromMedresaId,
        toMedresaId: input.toMedresaId,
      },
    },
    req
  );

  return { student: await enrichStudentDetail(student, req) };
};

export const withdrawStudent = async (
  req: Request,
  studentId: string,
  input: WithdrawStudentInput,
  performedBy: string
) => {
  const accessRow = await loadStudentForAccess(studentId);
  if (!accessRow) return { error: "STUDENT_NOT_FOUND" as const };

  if (!canWriteStudent(req, accessRow.current_medresa_id)) {
    return { error: "FORBIDDEN" as const };
  }

  if (accessRow.status !== StudentStatus.ACTIVE) {
    return { error: "INVALID_STATUS_TRANSITION" as const };
  }

  const withdrawnAt = input.withdrawnAt ?? new Date();

  const student = await prisma.$transaction(async (tx) => {
    await softDeleteActiveEnrollments(tx, studentId);
    await closeOpenEnrollmentPeriod(
      tx,
      studentId,
      accessRow.current_medresa_id,
      EnrollmentEndReason.WITHDRAWN,
      withdrawnAt
    );

    return tx.student.update({
      where: { id: studentId },
      data: {
        status: StudentStatus.WITHDRAWN,
        withdrawn_at: withdrawnAt,
        graduated_at: null,
      } as Prisma.StudentUncheckedUpdateInput,
      include: studentDetailInclude,
    });
  });

  await auditStudent(
    {
      tableName: "Student",
      recordId: studentId,
      action: AuditAction.UPDATE,
      performedBy,
      newValues: { event: "WITHDRAW", reason: input.reason ?? null, withdrawnAt },
    },
    req
  );

  return { student: await enrichStudentDetail(student, req) };
};

export const graduateStudent = async (
  req: Request,
  studentId: string,
  input: GraduateStudentInput,
  performedBy: string
) => {
  const accessRow = await loadStudentForAccess(studentId);
  if (!accessRow) return { error: "STUDENT_NOT_FOUND" as const };

  if (!canWriteStudent(req, accessRow.current_medresa_id)) {
    return { error: "FORBIDDEN" as const };
  }

  if (accessRow.status !== StudentStatus.ACTIVE) {
    return { error: "INVALID_STATUS_TRANSITION" as const };
  }

  const graduatedAt = input.graduatedAt ?? new Date();

  const student = await prisma.$transaction(async (tx) => {
    await softDeleteActiveEnrollments(tx, studentId);
    await closeOpenEnrollmentPeriod(
      tx,
      studentId,
      accessRow.current_medresa_id,
      EnrollmentEndReason.GRADUATED,
      graduatedAt
    );

    return tx.student.update({
      where: { id: studentId },
      data: {
        status: StudentStatus.GRADUATED,
        graduated_at: graduatedAt,
        withdrawn_at: null,
      } as Prisma.StudentUncheckedUpdateInput,
      include: studentDetailInclude,
    });
  });

  await auditStudent(
    {
      tableName: "Student",
      recordId: studentId,
      action: AuditAction.UPDATE,
      performedBy,
      newValues: { event: "GRADUATE", graduatedAt },
    },
    req
  );

  return { student: await enrichStudentDetail(student, req) };
};

export const reactivateStudent = async (
  req: Request,
  studentId: string,
  input: ReactivateStudentInput,
  performedBy: string
) => {
  const accessRow = await loadStudentForAccess(studentId);
  if (!accessRow) return { error: "STUDENT_NOT_FOUND" as const };

  if (!canWriteStudent(req, accessRow.current_medresa_id)) {
    return { error: "FORBIDDEN" as const };
  }

  if (
    accessRow.status !== StudentStatus.WITHDRAWN &&
    accessRow.status !== StudentStatus.GRADUATED
  ) {
    return { error: "INVALID_STATUS_TRANSITION" as const };
  }

  const reactivatedAt = input.reactivatedAt ?? new Date();

  const student = await prisma.$transaction(async (tx) => {
    const row = await tx.student.update({
      where: { id: studentId },
      data: {
        status: StudentStatus.ACTIVE,
        withdrawn_at: null,
        graduated_at: null,
      } as Prisma.StudentUncheckedUpdateInput,
      include: studentDetailInclude,
    });

    await openEnrollmentPeriod(tx, studentId, accessRow.current_medresa_id, reactivatedAt);
    return row;
  });

  await auditStudent(
    {
      tableName: "Student",
      recordId: studentId,
      action: AuditAction.UPDATE,
      performedBy,
      newValues: { event: "REACTIVATE", reactivatedAt },
    },
    req
  );

  return { student: await enrichStudentDetail(student, req) };
};

const teacherStudentCourseInclude = (medresaId?: string, courseIds?: string[]) => ({
  where: {
    deleted_at: null,
    ...(courseIds
      ? { medresa_course_id: { in: courseIds } }
      : medresaId
        ? { medresa_course: { medresa_id: medresaId, deleted_at: null } }
        : {}),
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
} as const);

/** Amir at medresa: full active student roster (not limited to assigned courses). */
const listTeacherStudentsAsAdmin = async (medresaId: string) => {
  const medresaActive = await assertMedresaActive(medresaId);
  if (!medresaActive) return { items: [] };

  const students = await prisma.student.findMany({
    where: {
      deleted_at: null,
      current_medresa_id: medresaId,
      status: StudentStatus.ACTIVE,
    },
    orderBy: { full_name: "asc" },
    include: {
      student_courses: teacherStudentCourseInclude(medresaId),
    },
  });

  return { items: students.map(mapTeacherStudentListItem) };
};

export const listTeacherStudents = async (req: Request, medresaId?: string) => {
  if (medresaId) {
    const allowedAtMedresa =
      req.user!.isSuperAdmin === true ||
      (req.user!.medresaRoles ?? []).some((r) => r.medresaId === medresaId);
    if (!allowedAtMedresa) return { items: [] };

    if (hasMedresaAdminRole(req, medresaId)) {
      return listTeacherStudentsAsAdmin(medresaId);
    }
  }

  const teacher = await prisma.teacher.findFirst({
    where: { user_id: req.user!.userId, deleted_at: null, status: Status.ACTIVE },
    select: { id: true },
  });
  if (!teacher) return { items: [] };

  if (medresaId) {
    const isTeacherAtMedresa = (req.user!.medresaRoles ?? []).some(
      (r) => r.medresaId === medresaId && r.role === MedresaRole.TEACHER
    );
    if (!isTeacherAtMedresa) return { items: [] };
  }

  const medresaCourseIds = await prisma.courseAssignment.findMany({
    where: {
      teacher_id: teacher.id,
      deleted_at: null,
      ...(medresaId
        ? {
            medresa_course: {
              medresa_id: medresaId,
              deleted_at: null,
              status: Status.ACTIVE,
            },
          }
        : {}),
    },
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
      student_courses: teacherStudentCourseInclude(undefined, courseIds),
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
