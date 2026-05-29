import bcrypt from "bcrypt";
import crypto from "crypto";
import { Prisma } from "../../../prisma/generated/prisma/client";
import { AuditAction, Status, UserStatus } from "../../../prisma/generated/prisma/enums";
import { auditLog } from "../../lib/audit";
import { deleteTeacherPhotoFile } from "../../lib/teacher-photo";
import { prisma } from "../../lib/prisma";
import { assertMedresaActive } from "../../lib/medresa-scope";
import { revokeAllUserRefreshTokens, sendUserInviteEmail } from "../m01-auth/auth.service";
import { upsertAssignment } from "./teacher-assignment.service";
import {
  mapTeacherDetail,
  mapTeacherListItem,
  teacherInclude,
} from "./teacher.mapper";
import type {
  CreateTeacherInput,
  ListTeachersQuery,
  UpdateTeacherInput,
} from "./teacher.schema";

const hashPassword = async (password: string): Promise<string> => bcrypt.hash(password, 10);

export const listTeachers = async (query: ListTeachersQuery) => {
  const { page, limit, search, status, medresaId, specialization } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.TeacherWhereInput = {
    deleted_at: null,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { user: { full_name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { user: { phone: { contains: search } } },
          ],
        }
      : {}),
    ...(medresaId
      ? {
          teacher_medresas: {
            some: { medresa_id: medresaId, deleted_at: null },
          },
        }
      : {}),
    ...(specialization
      ? {
          specialization: {
            path: ["en"],
            string_contains: specialization,
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.teacher.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      include: teacherInclude,
    }),
    prisma.teacher.count({ where }),
  ]);

  return {
    items: items.map(mapTeacherListItem),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getTeacherById = async (id: string) => {
  const teacher = await prisma.teacher.findFirst({
    where: { id, deleted_at: null },
    include: teacherInclude,
  });
  return teacher ? mapTeacherDetail(teacher) : null;
};

export const getTeacherByUserId = async (userId: string) => {
  const teacher = await prisma.teacher.findFirst({
    where: { user_id: userId, deleted_at: null },
    include: teacherInclude,
  });
  return teacher ? mapTeacherDetail(teacher) : null;
};

export const createTeacher = async (input: CreateTeacherInput, performedBy: string) => {
  if (input.initialAssignment) {
    const medresaActive = await assertMedresaActive(input.initialAssignment.medresaId);
    if (!medresaActive) return { error: "MEDRESA_INACTIVE" as const };
  }

  const adminSetPassword = Boolean(input.temporaryPassword);
  const passwordHash = adminSetPassword
    ? await hashPassword(input.temporaryPassword!)
    : await hashPassword(crypto.randomBytes(16).toString("base64url"));
  const status = input.status ?? Status.ACTIVE;
  const shouldSendInvite = !adminSetPassword || input.sendInviteEmail === true;

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        full_name: input.fullName,
        phone: input.phone,
        email: input.email,
        password_hash: passwordHash,
        status: status === Status.ACTIVE ? UserStatus.ACTIVE : UserStatus.INACTIVE,
        is_super_admin: false,
      },
    });

    const teacher = await tx.teacher.create({
      data: {
        user_id: user.id,
        full_name: input.fullName,
        phone: input.phone,
        email: input.email,
        specialization: input.specialization,
        date_joined: input.dateJoined,
        status,
      },
    });

    if (input.initialAssignment) {
      await upsertAssignment(tx, teacher.id, input.initialAssignment);
    }

    const teacherWithRelations = await tx.teacher.findUniqueOrThrow({
      where: { id: teacher.id },
      include: teacherInclude,
    });

    return { user, teacher: teacherWithRelations };
  });

  if (shouldSendInvite) {
    await sendUserInviteEmail(result.user.id, result.user.email);
  }

  await auditLog({
    tableName: "User",
    recordId: result.user.id,
    action: AuditAction.INSERT,
    performedBy,
    newValues: {
      event: "TEACHER_USER_CREATED",
      email: result.user.email,
      passwordSetByAdmin: adminSetPassword,
      inviteEmailSent: shouldSendInvite,
    },
  });

  await auditLog({
    tableName: "Teacher",
    recordId: result.teacher.id,
    action: AuditAction.INSERT,
    performedBy,
    newValues: {
      fullName: result.user.full_name,
      email: result.user.email,
      inviteEmailSent: shouldSendInvite,
      ...(input.initialAssignment
        ? {
            initialMedresaId: input.initialAssignment.medresaId,
            initialRole: input.initialAssignment.role,
          }
        : {}),
    },
  });

  if (input.initialAssignment) {
    await auditLog({
      tableName: "TeacherMedresa",
      recordId: result.teacher.id,
      action: AuditAction.INSERT,
      performedBy,
      newValues: {
        event: "INITIAL_ASSIGNMENT",
        medresaId: input.initialAssignment.medresaId,
        role: input.initialAssignment.role,
      },
    });
  }

  return { teacher: mapTeacherDetail(result.teacher) };
};

export const updateTeacher = async (
  id: string,
  input: UpdateTeacherInput,
  performedBy: string
) => {
  const existing = await prisma.teacher.findFirst({
    where: { id, deleted_at: null },
  });

  if (!existing) return null;

  const teacher = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: existing.user_id },
      data: {
        ...(input.fullName !== undefined ? { full_name: input.fullName } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.status !== undefined
          ? {
              status:
                input.status === Status.ACTIVE ? UserStatus.ACTIVE : UserStatus.INACTIVE,
            }
          : {}),
      },
    });

    return tx.teacher.update({
      where: { id },
      data: {
        ...(input.specialization !== undefined ? { specialization: input.specialization } : {}),
        ...(input.dateJoined !== undefined ? { date_joined: input.dateJoined } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
      include: teacherInclude,
    });
  });

  await auditLog({
    tableName: "Teacher",
    recordId: id,
    action: AuditAction.UPDATE,
    performedBy,
    newValues: input as Record<string, unknown>,
  });

  return mapTeacherDetail(teacher);
};

export const deactivateTeacher = async (id: string, performedBy: string) => {
  const existing = await prisma.teacher.findFirst({
    where: { id, deleted_at: null },
  });

  if (!existing) return null;

  const teacher = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: existing.user_id },
      data: { status: UserStatus.INACTIVE },
    });

    return tx.teacher.update({
      where: { id },
      data: { status: Status.INACTIVE },
      include: teacherInclude,
    });
  });

  await revokeAllUserRefreshTokens(existing.user_id);

  await auditLog({
    tableName: "Teacher",
    recordId: id,
    action: AuditAction.UPDATE,
    performedBy,
    newValues: { event: "DEACTIVATE", status: Status.INACTIVE },
  });

  return mapTeacherDetail(teacher);
};

export const reactivateTeacher = async (id: string, performedBy: string) => {
  const existing = await prisma.teacher.findFirst({
    where: { id, deleted_at: null },
  });

  if (!existing) return null;

  const teacher = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: existing.user_id },
      data: { status: UserStatus.ACTIVE },
    });

    return tx.teacher.update({
      where: { id },
      data: { status: Status.ACTIVE },
      include: teacherInclude,
    });
  });

  await auditLog({
    tableName: "Teacher",
    recordId: id,
    action: AuditAction.UPDATE,
    performedBy,
    newValues: { event: "REACTIVATE", status: Status.ACTIVE },
  });

  return mapTeacherDetail(teacher);
};

export const setTeacherPhoto = async (
  id: string,
  photoPath: string,
  performedBy: string
) => {
  const existing = await prisma.teacher.findFirst({
    where: { id, deleted_at: null },
  });

  if (!existing) return null;

  if (existing.photo_url) {
    await deleteTeacherPhotoFile(existing.photo_url);
  }

  const teacher = await prisma.teacher.update({
    where: { id },
    data: { photo_url: photoPath },
    include: teacherInclude,
  });

  await auditLog({
    tableName: "Teacher",
    recordId: id,
    action: AuditAction.UPDATE,
    performedBy,
    newValues: { event: "PHOTO_UPDATED" },
  });

  return mapTeacherDetail(teacher);
};

export const getTeacherPhotoPath = async (id: string) => {
  const teacher = await prisma.teacher.findFirst({
    where: { id, deleted_at: null },
    select: { photo_url: true, user_id: true },
  });
  return teacher;
};
