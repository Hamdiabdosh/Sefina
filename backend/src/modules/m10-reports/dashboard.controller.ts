import type { Request, Response } from "express";
import {
  getMedresaDashboard,
  getSuperAdminDashboard,
  getTeacherDashboard,
} from "./dashboard.service";
import type { MedresaDashboardQuery } from "./report.schema";

const err = (res: Response, status: number, code: string, message: string) => {
  res.status(status).json({ success: false, error: { code, message } });
};

export const getTeacherDashboardHandler = async (req: Request, res: Response): Promise<void> => {
  const data = await getTeacherDashboard(req);
  if ("error" in data) {
    err(res, 403, data.error ?? "FORBIDDEN", "Access denied");
    return;
  }
  res.status(200).json({ success: true, data });
};

export const getMedresaDashboardHandler = async (req: Request, res: Response): Promise<void> => {
  const data = await getMedresaDashboard(req, req.validatedQuery as MedresaDashboardQuery);
  if ("error" in data) {
    const status =
      data.error === "FORBIDDEN" ? 403 : data.error === "MEDRESA_REQUIRED" ? 400 : 403;
    err(
      res,
      status,
      data.error ?? "FORBIDDEN",
      data.error === "MEDRESA_REQUIRED" ? "medresaId required" : "Access denied"
    );
    return;
  }
  res.status(200).json({ success: true, data });
};

export const getSuperAdminDashboardHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const data = await getSuperAdminDashboard(req);
  if ("error" in data) {
    err(res, 403, data.error ?? "FORBIDDEN", "Access denied");
    return;
  }
  res.status(200).json({ success: true, data });
};
