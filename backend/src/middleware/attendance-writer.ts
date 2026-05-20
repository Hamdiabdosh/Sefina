import type { NextFunction, Request, Response } from "express";
import { MedresaRole } from "../../prisma/generated/prisma/enums";

/**
 * Users who may record medresa daily attendance: TEACHER or ADMIN (Amir) at any medresa.
 * Super Admin remains read-only for attendance writes (see business rules).
 */
export const requireAttendanceWriter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
    return;
  }
  if (req.user.isSuperAdmin) {
    res.status(403).json({
      success: false,
      error: { code: "FORBIDDEN", message: "Super admin cannot record attendance" },
    });
    return;
  }
  const roles = req.user.medresaRoles ?? [];
  const ok = roles.some(
    (r) => r.role === MedresaRole.TEACHER || r.role === MedresaRole.ADMIN
  );
  if (!ok) {
    res.status(403).json({
      success: false,
      error: { code: "FORBIDDEN", message: "Insufficient permissions" },
    });
    return;
  }
  next();
};
