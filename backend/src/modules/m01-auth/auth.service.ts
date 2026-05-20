import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { AuditAction, Status, UserStatus } from "../../../prisma/generated/prisma/enums";
import { env, isGoogleOAuthConfigured } from "../../config/env";
import { auditLog } from "../../lib/audit";
import { verifyGoogleIdToken } from "../../lib/google-oauth";
import { sendPasswordResetEmail, sendWelcomeEmail } from "../../lib/mailer";
import { prisma } from "../../lib/prisma";

type LoginInput = {
  identifier: string;
  password: string;
};

type RefreshInput = {
  refreshToken: string;
};

type PasswordResetRequestInput = {
  identifier: string;
};

type PasswordResetConfirmInput = {
  token: string;
  newPassword: string;
};

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";

const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const makeOpaqueToken = (): string => crypto.randomBytes(48).toString("hex");

const getResetTokenExpiryMs = (): number =>
  env.RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;

const invalidateUnusedResetTokens = async (userId: string): Promise<void> => {
  await prisma.passwordResetToken.updateMany({
    where: {
      user_id: userId,
      used: false,
      expires_at: { gt: new Date() },
    },
    data: { used: true },
  });
};

const issuePasswordResetToken = async (
  userId: string
): Promise<{ resetUrl: string }> => {
  await invalidateUnusedResetTokens(userId);

  const rawToken = makeOpaqueToken();
  const expiresAt = new Date(Date.now() + getResetTokenExpiryMs());

  await prisma.passwordResetToken.create({
    data: {
      user_id: userId,
      token_hash: hashToken(rawToken),
      expires_at: expiresAt,
      used: false,
    },
  });

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;
  return { resetUrl };
};

const createAccessToken = (payload: {
  userId: string;
  isSuperAdmin: boolean;
  medresaRoles: Array<{ medresaId: string; role: "TEACHER" | "ADMIN" }>;
}): string =>
  jwt.sign(
    {
      sub: payload.userId,
      isSuperAdmin: payload.isSuperAdmin,
      medresaRoles: payload.medresaRoles,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );

const createRefreshToken = (userId: string): string =>
  jwt.sign(
    {
      sub: userId,
      type: "refresh",
      jti: crypto.randomUUID(),
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL }
  );

const mapMedresaRoles = async (
  rows: Array<{ medresa_id: string; role: "TEACHER" | "ADMIN" }>
) => {
  if (rows.length === 0) return [];

  const medresas = await prisma.medresa.findMany({
    where: {
      id: { in: rows.map((r) => r.medresa_id) },
      status: Status.ACTIVE,
      deleted_at: null,
    },
    select: { id: true, name: true },
  });

  const activeById = new Map(medresas.map((m) => [m.id, m.name]));

  return rows
    .filter((row) => activeById.has(row.medresa_id))
    .map((row) => ({
      medresaId: row.medresa_id,
      medresaName: activeById.get(row.medresa_id)!,
      role: row.role,
    }));
};

const buildUserAuthPayload = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teacher: {
        include: {
          teacher_medresas: {
            where: { deleted_at: null },
            select: { medresa_id: true, role: true },
          },
        },
      },
    },
  });

  if (!user || user.deleted_at || user.status !== UserStatus.ACTIVE) {
    return null;
  }

  const medresaRoles = await mapMedresaRoles(
    user.teacher?.teacher_medresas ?? []
  );

  const jwtMedresaRoles = medresaRoles.map((r) => ({
    medresaId: r.medresaId,
    role: r.role,
  }));

  return {
    accessToken: createAccessToken({
      userId: user.id,
      isSuperAdmin: user.is_super_admin,
      medresaRoles: jwtMedresaRoles,
    }),
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      isSuperAdmin: user.is_super_admin,
      medresaRoles,
    },
  };
};

const issueRefreshToken = async (userId: string) => {
  const refreshToken = createRefreshToken(userId);
  const decoded = jwt.decode(refreshToken) as { exp?: number } | null;
  const expiresAt = new Date((decoded?.exp ?? 0) * 1000);

  await prisma.refreshToken.create({
    data: {
      user_id: userId,
      token_hash: hashToken(refreshToken),
      expires_at: expiresAt,
      revoked: false,
    },
  });

  return refreshToken;
};

const createAuthSession = async (userId: string) => {
  const authPayload = await buildUserAuthPayload(userId);
  if (!authPayload) return null;
  const refreshToken = await issueRefreshToken(userId);
  return {
    ...authPayload,
    refreshToken,
  };
};

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.identifier }, { phone: input.identifier }],
      deleted_at: null,
      status: UserStatus.ACTIVE,
    },
  });

  if (!user) return null;

  const passwordOk = await bcrypt.compare(input.password, user.password_hash);
  if (!passwordOk) return null;

  return createAuthSession(user.id);
};

export type GoogleLoginResult =
  | { ok: true; session: NonNullable<Awaited<ReturnType<typeof createAuthSession>>> }
  | { ok: false; reason: "NOT_CONFIGURED" | "INVALID_TOKEN" | "ACCOUNT_NOT_FOUND" };

export const loginWithGoogle = async (credential: string): Promise<GoogleLoginResult> => {
  if (!isGoogleOAuthConfigured()) {
    return { ok: false, reason: "NOT_CONFIGURED" };
  }

  const googleUser = await verifyGoogleIdToken(credential);
  if (!googleUser) {
    return { ok: false, reason: "INVALID_TOKEN" };
  }

  const user = await prisma.user.findFirst({
    where: {
      email: { equals: googleUser.email, mode: "insensitive" },
      deleted_at: null,
      status: UserStatus.ACTIVE,
    },
  });

  if (!user) {
    return { ok: false, reason: "ACCOUNT_NOT_FOUND" };
  }

  const session = await createAuthSession(user.id);
  if (!session) {
    return { ok: false, reason: "ACCOUNT_NOT_FOUND" };
  }

  return { ok: true, session };
};

export const refreshSession = async (input: RefreshInput) => {
  let tokenPayload: { sub: string; type?: string; exp?: number };

  try {
    tokenPayload = jwt.verify(input.refreshToken, env.JWT_REFRESH_SECRET) as {
      sub: string;
      type?: string;
      exp?: number;
    };
  } catch {
    return null;
  }

  if (tokenPayload.type !== "refresh") return null;

  const stored = await prisma.refreshToken.findFirst({
    where: {
      token_hash: hashToken(input.refreshToken),
      revoked: false,
      expires_at: { gt: new Date() },
    },
  });

  if (!stored) return null;

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked: true },
  });

  const authPayload = await buildUserAuthPayload(tokenPayload.sub);
  if (!authPayload) return null;
  const refreshToken = await issueRefreshToken(tokenPayload.sub);

  return {
    ...authPayload,
    refreshToken,
  };
};

export const revokeRefreshToken = async (refreshToken: string | null) => {
  if (!refreshToken) return;

  await prisma.refreshToken.updateMany({
    where: {
      token_hash: hashToken(refreshToken),
      revoked: false,
    },
    data: { revoked: true },
  });
};

export const revokeAllUserRefreshTokens = async (userId: string) => {
  await prisma.refreshToken.updateMany({
    where: { user_id: userId, revoked: false },
    data: { revoked: true },
  });
};

export const requestPasswordReset = async (input: PasswordResetRequestInput) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.identifier }, { phone: input.identifier }],
      deleted_at: null,
      status: UserStatus.ACTIVE,
    },
  });

  if (!user) return { accepted: true as const };

  const { resetUrl } = await issuePasswordResetToken(user.id);
  await sendPasswordResetEmail(user.email, resetUrl);

  return { accepted: true as const, userId: user.id };
};

export const confirmPasswordReset = async (input: PasswordResetConfirmInput) => {
  const tokenHash = hashToken(input.token);

  const resetRecord = await prisma.passwordResetToken.findFirst({
    where: {
      token_hash: tokenHash,
      used: false,
      expires_at: { gt: new Date() },
    },
  });

  if (!resetRecord) return { ok: false as const };

  const nextPasswordHash = await bcrypt.hash(input.newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.user_id },
      data: { password_hash: nextPasswordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { used: true },
    }),
    prisma.refreshToken.updateMany({
      where: { user_id: resetRecord.user_id, revoked: false },
      data: { revoked: true },
    }),
  ]);

  return { ok: true as const, userId: resetRecord.user_id };
};

export const getMyProfile = async (userId: string) => {
  const authPayload = await buildUserAuthPayload(userId);
  if (!authPayload) {
    return null;
  }

  return authPayload.user;
};

export const sendUserInviteEmail = async (userId: string, email: string): Promise<void> => {
  const { resetUrl } = await issuePasswordResetToken(userId);
  await sendWelcomeEmail(email, resetUrl);
};

export const logAuthEvent = async (
  event: string,
  recordId: string,
  performedBy: string | null,
  ip?: string
) => {
  await auditLog({
    tableName: "auth",
    recordId,
    action: AuditAction.INSERT,
    performedBy,
    newValues: { event },
    ip: ip ?? null,
  });
};
