import type { NextFunction, Request, Response } from "express";
import { isTeacherOnly } from "../lib/fee-scope";

/** BR-11: teachers (without admin role) cannot access any fee endpoint. */
export const requireFeeAccess = (
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
  if (isTeacherOnly(req)) {
    res.status(403).json({
      success: false,
      error: { code: "FORBIDDEN", message: "Teachers cannot access fee data" },
    });
    return;
  }
  next();
};
