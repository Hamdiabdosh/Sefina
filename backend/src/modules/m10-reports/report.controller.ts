import type { Request, Response } from "express";
import { getEnrollmentReport } from "./report-enrollment.service";
import { getAttendanceReport } from "./report-attendance.service";
import { getFeesReport } from "./report-fees.service";
import { getSalaryReport } from "./report-salary.service";
import { getGradesReport } from "./report-grades.service";
import type { ReportRangeQuery } from "./report.schema";

const err = (res: Response, status: number, code: string, message: string) => {
  res.status(status).json({ success: false, error: { code, message } });
};

const handleReport = (res: Response, result: Record<string, unknown>) => {
  if ("error" in result && typeof result.error === "string") {
    const code = result.error;
    const status =
      code === "FORBIDDEN"
        ? 403
        : code === "MEDRESA_REQUIRED" || code === "COURSE_REQUIRED" || code === "INVALID_DATE_RANGE"
          ? 400
          : 400;
    err(res, status, code, code);
    return;
  }
  res.status(200).json({ success: true, data: result });
};

export const getEnrollmentReportHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await getEnrollmentReport(req, req.validatedQuery as ReportRangeQuery);
  handleReport(res, result);
};

export const getAttendanceReportHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await getAttendanceReport(req, req.validatedQuery as ReportRangeQuery);
  handleReport(res, result);
};

export const getFeesReportHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await getFeesReport(req, req.validatedQuery as ReportRangeQuery);
  handleReport(res, result);
};

export const getSalaryReportHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await getSalaryReport(req, req.validatedQuery as ReportRangeQuery);
  handleReport(res, result);
};

export const getGradesReportHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await getGradesReport(req, req.validatedQuery as ReportRangeQuery);
  handleReport(res, result);
};
