import type { NextFunction, Request, Response } from "express";
import { MedresaRole } from "../../prisma/generated/prisma/enums";

/** Teachers with at least one medresa TEACHER role may submit grades. Super Admin is read-only for writes. */
export const requireGradeWriter = (
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
      error: { code: "FORBIDDEN", message: "Super admin cannot record grades" },
    });
    return;
  }
  const ok = (req.user.medresaRoles ?? []).some((r) => r.role === MedresaRole.TEACHER);
  if (!ok) {
    res.status(403).json({
      success: false,
      error: { code: "FORBIDDEN", message: "Insufficient permissions" },
    });
    return;
  }
  next();
};
