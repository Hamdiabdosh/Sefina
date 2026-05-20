import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { validateQuery } from "../../middleware/validate-query";
import {
  getAttendanceReportHandler,
  getEnrollmentReportHandler,
  getFeesReportHandler,
  getGradesReportHandler,
  getSalaryReportHandler,
} from "./report.controller";
import {
  attendanceReportQuerySchema,
  enrollmentReportQuerySchema,
  feesReportQuerySchema,
  gradesReportQuerySchema,
  salaryReportQuerySchema,
} from "./report.schema";

const reportRoutes = Router();

reportRoutes.get(
  "/enrollment",
  requireAuth,
  requireRole(["medresa_admin", "super_admin"]),
  validateQuery(enrollmentReportQuerySchema),
  getEnrollmentReportHandler
);

reportRoutes.get(
  "/attendance",
  requireAuth,
  requireRole(["teacher", "medresa_admin", "super_admin"]),
  validateQuery(attendanceReportQuerySchema),
  getAttendanceReportHandler
);

reportRoutes.get(
  "/fees",
  requireAuth,
  requireRole(["medresa_admin", "super_admin"]),
  validateQuery(feesReportQuerySchema),
  getFeesReportHandler
);

reportRoutes.get(
  "/salary",
  requireAuth,
  requireRole(["super_admin"]),
  validateQuery(salaryReportQuerySchema),
  getSalaryReportHandler
);

reportRoutes.get(
  "/grades",
  requireAuth,
  requireRole(["teacher", "medresa_admin", "super_admin"]),
  validateQuery(gradesReportQuerySchema),
  getGradesReportHandler
);

export default reportRoutes;
