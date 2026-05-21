import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { MedresaRole } from "../../prisma/generated/prisma/enums";
import { env } from "../config/env";
import type { AuthenticatedUser } from "../types/auth";

type AuthJwtPayload = {
  sub: string;
  isSuperAdmin: boolean;
  medresaRoles: Array<{ medresaId: string; role: MedresaRole }>;
  iat: number;
  exp: number;
};

const extractBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length);
};

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Missing bearer token" },
    });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
    }) as AuthJwtPayload;

    req.user = {
      userId: payload.sub,
      isSuperAdmin: payload.isSuperAdmin,
      medresaRoles: payload.medresaRoles ?? [],
    } satisfies AuthenticatedUser;

    next();
  } catch (_error) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Invalid or expired token" },
    });
  }
};

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user?.isSuperAdmin) {
    res.status(403).json({
      success: false,
      error: { code: "FORBIDDEN", message: "Super Admin role required" },
    });
    return;
  }
  next();
};
