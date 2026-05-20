import { Router } from "express";
import { requireAuth, requireSuperAdmin } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import {
  assignTeacherRankHandler,
  getTeacherRankHistoryHandler,
  getTeacherSalaryHistoryHandler,
} from "./salary.controller";
import { assignTeacherRankSchema } from "./salary.schema";

const salaryTeacherRoutes = Router({ mergeParams: true });
const superAdminOnly = [requireAuth, requireSuperAdmin] as const;

salaryTeacherRoutes.post(
  "/:id/rank",
  ...superAdminOnly,
  validateBody(assignTeacherRankSchema),
  assignTeacherRankHandler
);
salaryTeacherRoutes.get("/:id/rank-history", ...superAdminOnly, getTeacherRankHistoryHandler);
salaryTeacherRoutes.get(
  "/:id/salary-history",
  ...superAdminOnly,
  getTeacherSalaryHistoryHandler
);

export default salaryTeacherRoutes;
