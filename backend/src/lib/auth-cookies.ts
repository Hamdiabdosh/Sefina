import type { CookieOptions, Request, Response } from "express";
import { env } from "../config/env";

export const REFRESH_TOKEN_COOKIE = "refreshToken";

/** Vercel + Render/Railway: SPA and API on different hosts need SameSite=None. */
const isCrossSiteDeployment = (): boolean => {
  if (env.NODE_ENV !== "production") return false;
  try {
    const { hostname } = new URL(env.FRONTEND_URL);
    return hostname !== "localhost" && hostname !== "127.0.0.1";
  } catch {
    return false;
  }
};

const refreshCookieOptions = (): CookieOptions => {
  const crossSite = isCrossSiteDeployment();
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: crossSite ? "none" : "lax",
    path: "/api/v1/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

export const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_TOKEN_COOKIE, token, refreshCookieOptions());
};

export const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(REFRESH_TOKEN_COOKIE, refreshCookieOptions());
};

export const getRefreshTokenFromRequest = (req: Request): string | null => {
  const cookieToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  return null;
};
