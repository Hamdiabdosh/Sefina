import type { Request, Response } from "express";
import { AuditAction } from "../../../prisma/generated/prisma/enums";
import { auditLog, getClientIp } from "../../lib/audit";
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
  setRefreshTokenCookie,
} from "../../lib/auth-cookies";
import {
  confirmPasswordReset,
  getMyProfile,
  logAuthEvent,
  login,
  refreshSession,
  requestPasswordReset,
  revokeRefreshToken,
} from "./auth.service";

export const loginHandler = async (req: Request, res: Response): Promise<void> => {
  const ip = getClientIp(req);
  const result = await login(req.body);

  if (!result) {
    await logAuthEvent("LOGIN_FAILED", req.body.identifier ?? "unknown", null, ip);
    res.status(401).json({
      success: false,
      error: { code: "INVALID_CREDENTIALS", message: "Invalid email/phone or password" },
    });
    return;
  }

  setRefreshTokenCookie(res, result.refreshToken);
  await logAuthEvent("LOGIN_SUCCESS", result.user.id, result.user.id, ip);

  res.status(200).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
};

export const meHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
    return;
  }

  const profile = await getMyProfile(req.user.userId);
  if (!profile) {
    res.status(404).json({
      success: false,
      error: { code: "USER_NOT_FOUND", message: "User profile not found" },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: profile,
  });
};

export const refreshHandler = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = getRefreshTokenFromRequest(req);

  if (!refreshToken) {
    res.status(401).json({
      success: false,
      error: { code: "INVALID_REFRESH_TOKEN", message: "Refresh token is missing" },
    });
    return;
  }

  const result = await refreshSession({ refreshToken });
  if (!result) {
    clearRefreshTokenCookie(res);
    res.status(401).json({
      success: false,
      error: { code: "INVALID_REFRESH_TOKEN", message: "Refresh token is invalid or expired" },
    });
    return;
  }

  setRefreshTokenCookie(res, result.refreshToken);

  res.status(200).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
};

export const logoutHandler = async (req: Request, res: Response): Promise<void> => {
  const ip = getClientIp(req);
  const refreshToken = getRefreshTokenFromRequest(req);

  await revokeRefreshToken(refreshToken);
  clearRefreshTokenCookie(res);

  if (req.user?.userId) {
    await logAuthEvent("LOGOUT", req.user.userId, req.user.userId, ip);
  }

  res.status(200).json({
    success: true,
    data: { message: "Logged out successfully" },
  });
};

export const passwordResetRequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const ip = getClientIp(req);
  const result = await requestPasswordReset(req.body);

  if (result.userId) {
    await logAuthEvent("PASSWORD_RESET_REQUEST", result.userId, result.userId, ip);
  }

  res.status(200).json({
    success: true,
    data: { accepted: true },
  });
};

export const passwordResetConfirmHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const ip = getClientIp(req);
  const result = await confirmPasswordReset(req.body);

  if (!result.ok) {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_RESET_TOKEN", message: "Reset token is invalid or expired" },
    });
    return;
  }

  await auditLog({
    tableName: "User",
    recordId: result.userId,
    action: AuditAction.UPDATE,
    performedBy: result.userId,
    newValues: { event: "PASSWORD_RESET_CONFIRM" },
    ip,
  });

  res.status(200).json({
    success: true,
    data: { message: "Password reset successful" },
  });
};
