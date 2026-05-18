import type { CookieOptions, Request, Response } from "express";
import { env } from "../config/env";

export const REFRESH_TOKEN_COOKIE = "refreshToken";

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/v1/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

export const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_TOKEN_COOKIE, token, cookieOptions());
};

export const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
  });
};

export const getRefreshTokenFromRequest = (req: Request): string | null => {
  const cookieToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  const bodyToken = req.body?.refreshToken;
  if (typeof bodyToken === "string" && bodyToken.length > 0 && env.NODE_ENV !== "production") {
    return bodyToken;
  }

  return null;
};
