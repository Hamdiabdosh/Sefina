import bcrypt from "bcrypt";
import crypto from "crypto";
import { Prisma } from "../../../prisma/generated/prisma/client";
import { AuditAction, UserStatus } from "../../../prisma/generated/prisma/enums";
import { auditLog } from "../../lib/audit";
import { prisma } from "../../lib/prisma";
import { sendUserInviteEmail, revokeAllUserRefreshTokens } from "../m01-auth/auth.service";
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from "./user.schema";

const mapUserListItem = (user: {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  status: UserStatus;
  is_super_admin: boolean;
  teacher: {
    teacher_medresas: Array<{
      role: "TEACHER" | "ADMIN";
      medresa: { id: string; name: string };
    }>;
  } | null;
}) => ({
  id: user.id,
  fullName: user.full_name,
  phone: user.phone,
  email: user.email,
  status: user.status,
  isSuperAdmin: user.is_super_admin,
  medresaRoles: (user.teacher?.teacher_medresas ?? []).map((row) => ({
    medresaId: row.medresa.id,
    medresaName: row.medresa.name,
    role: row.role,
  })),
});

export const listUsers = async (query: ListUsersQuery) => {
  const { page, limit, search, status, medresaId } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    deleted_at: null,
    is_super_admin: false,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { full_name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
          ],
        }
      : {}),
    ...(medresaId
      ? {
          teacher: {
            teacher_medresas: {
              some: { medresa_id: medresaId, deleted_at: null },
            },
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      include: {
        teacher: {
          include: {
            teacher_medresas: {
              where: { deleted_at: null },
              include: { medresa: { select: { id: true, name: true } } },
            },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: items.map(mapUserListItem),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const hashPassword = async (password: string): Promise<string> => bcrypt.hash(password, 10);

export const setUserTemporaryPassword = async (
  id: string,
  temporaryPassword: string,
  performedBy: string
) => {
  const existing = await prisma.user.findFirst({
    where: { id, deleted_at: null, is_super_admin: false },
  });

  if (!existing) return null;

  const passwordHash = await hashPassword(temporaryPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { password_hash: passwordHash },
    }),
    prisma.refreshToken.updateMany({
      where: { user_id: id, revoked: false },
      data: { revoked: true },
    }),
  ]);

  await auditLog({
    tableName: "User",
    recordId: id,
    action: AuditAction.UPDATE,
    performedBy,
    newValues: { event: "TEMP_PASSWORD_SET" },
  });

  return { id: existing.id, email: existing.email };
};

export const createUser = async (input: CreateUserInput, performedBy: string) => {
  const adminSetPassword = Boolean(input.temporaryPassword);
  const passwordHash = adminSetPassword
    ? await hashPassword(input.temporaryPassword!)
    : await hashPassword(crypto.randomBytes(16).toString("base64url"));

  const user = await prisma.user.create({
    data: {
      full_name: input.fullName,
      phone: input.phone,
      email: input.email,
      password_hash: passwordHash,
      status: UserStatus.ACTIVE,
      is_super_admin: false,
    },
  });

  const shouldSendInvite =
    !adminSetPassword || input.sendInviteEmail === true;

  if (shouldSendInvite) {
    await sendUserInviteEmail(user.id, user.email);
  }

  await auditLog({
    tableName: "User",
    recordId: user.id,
    action: AuditAction.INSERT,
    performedBy,
    newValues: {
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      passwordSetByAdmin: adminSetPassword,
      inviteEmailSent: shouldSendInvite,
    },
  });

  return {
    id: user.id,
    fullName: user.full_name,
    phone: user.phone,
    email: user.email,
    status: user.status,
    inviteEmailSent: shouldSendInvite,
    passwordSetByAdmin: adminSetPassword,
  };
};

export const updateUser = async (
  id: string,
  input: UpdateUserInput,
  performedBy: string
) => {
  const existing = await prisma.user.findFirst({
    where: { id, deleted_at: null, is_super_admin: false },
  });

  if (!existing) return null;

  if (input.temporaryPassword) {
    await setUserTemporaryPassword(id, input.temporaryPassword, performedBy);
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(input.fullName !== undefined ? { full_name: input.fullName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
    include: {
      teacher: {
        include: {
          teacher_medresas: {
            where: { deleted_at: null },
            include: { medresa: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  await auditLog({
    tableName: "User",
    recordId: user.id,
    action: AuditAction.UPDATE,
    performedBy,
    oldValues: {
      fullName: existing.full_name,
      phone: existing.phone,
      email: existing.email,
      status: existing.status,
    },
    newValues: {
      fullName: user.full_name,
      phone: user.phone,
      email: user.email,
      status: user.status,
      ...(input.temporaryPassword ? { tempPasswordUpdated: true } : {}),
    },
  });

  return mapUserListItem(user);
};

export const deactivateUser = async (id: string, performedBy: string) => {
  const existing = await prisma.user.findFirst({
    where: { id, deleted_at: null },
  });

  if (!existing) return { error: "NOT_FOUND" as const };
  if (existing.is_super_admin) return { error: "SUPER_ADMIN" as const };

  const user = await prisma.user.update({
    where: { id },
    data: { status: UserStatus.INACTIVE },
    include: {
      teacher: {
        include: {
          teacher_medresas: {
            where: { deleted_at: null },
            include: { medresa: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  await revokeAllUserRefreshTokens(id);

  await auditLog({
    tableName: "User",
    recordId: id,
    action: AuditAction.UPDATE,
    performedBy,
    newValues: { event: "DEACTIVATE", status: UserStatus.INACTIVE },
  });

  return { user: mapUserListItem(user) };
};

export const reactivateUser = async (id: string, performedBy: string) => {
  const existing = await prisma.user.findFirst({
    where: { id, deleted_at: null, is_super_admin: false },
  });

  if (!existing) return null;

  const user = await prisma.user.update({
    where: { id },
    data: { status: UserStatus.ACTIVE },
    include: {
      teacher: {
        include: {
          teacher_medresas: {
            where: { deleted_at: null },
            include: { medresa: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  await auditLog({
    tableName: "User",
    recordId: id,
    action: AuditAction.UPDATE,
    performedBy,
    newValues: { event: "REACTIVATE", status: UserStatus.ACTIVE },
  });

  return mapUserListItem(user);
};

export const resendUserInvite = async (id: string, performedBy: string) => {
  const user = await prisma.user.findFirst({
    where: { id, deleted_at: null, is_super_admin: false, status: UserStatus.ACTIVE },
  });

  if (!user) return null;

  await sendUserInviteEmail(user.id, user.email);

  await auditLog({
    tableName: "User",
    recordId: user.id,
    action: AuditAction.UPDATE,
    performedBy,
    newValues: { event: "INVITE_RESENT", email: user.email },
  });

  return { id: user.id, email: user.email };
};
