import type { NextFunction, Request, Response } from "express";
import { canRecordFeePayment } from "../lib/fee-scope";

/** Amir at medresa may record payments; Super Admin and teachers cannot. */
export const requireFeeRecorder = (
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
  const medresaId = String(req.body?.medresaId ?? req.params.medresaId ?? "");
  if (!medresaId || !canRecordFeePayment(req, medresaId)) {
    res.status(403).json({
      success: false,
      error: { code: "FORBIDDEN", message: "Insufficient permissions to record fees" },
    });
    return;
  }
  next();
};
