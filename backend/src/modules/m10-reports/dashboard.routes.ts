import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { validateQuery } from "../../middleware/validate-query";
import {
  getMedresaDashboardHandler,
  getSuperAdminDashboardHandler,
  getTeacherDashboardHandler,
} from "./dashboard.controller";
import { medresaDashboardQuerySchema } from "./report.schema";

const dashboardRoutes = Router();

dashboardRoutes.get(
  "/teacher",
  requireAuth,
  requireRole(["teacher"]),
  getTeacherDashboardHandler
);

dashboardRoutes.get(
  "/medresa",
  requireAuth,
  requireRole(["medresa_admin", "super_admin"]),
  validateQuery(medresaDashboardQuerySchema),
  getMedresaDashboardHandler
);

dashboardRoutes.get(
  "/super-admin",
  requireAuth,
  requireRole(["super_admin"]),
  getSuperAdminDashboardHandler
);

export default dashboardRoutes;
