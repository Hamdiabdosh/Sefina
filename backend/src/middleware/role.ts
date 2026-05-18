import type { NextFunction, Request, Response } from "express";
import { MedresaRole } from "../../prisma/generated/prisma/enums";

export type AppRole = "super_admin" | "medresa_admin" | "teacher";

type RequireRoleOptions = {
  medresaIdParam?: string;
};

const hasMedresaRole = (
  req: Request,
  role: MedresaRole,
  medresaId?: string
): boolean => {
  const roles = req.user?.medresaRoles ?? [];
  return roles.some(
    (entry) => entry.role === role && (medresaId ? entry.medresaId === medresaId : true)
  );
};

export const requireRole =
  (allowedRoles: AppRole[], options?: RequireRoleOptions) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
      return;
    }

    const medresaId = options?.medresaIdParam
      ? (req.params[options.medresaIdParam] as string | undefined)
      : undefined;

    const allowed = allowedRoles.some((role) => {
      if (role === "super_admin") return req.user?.isSuperAdmin === true;
      if (role === "medresa_admin") return hasMedresaRole(req, MedresaRole.ADMIN, medresaId);
      if (role === "teacher") return hasMedresaRole(req, MedresaRole.TEACHER, medresaId);
      return false;
    });

    if (!allowed) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Insufficient permissions" },
      });
      return;
    }

    next();
  };
