import { Router } from "express";
import { requireAuth, requireSuperAdmin } from "../../middleware/auth";
import { validateQuery } from "../../middleware/validate-query";
import { getNetworkSalaryOverviewHandler } from "./salary.controller";
import { salaryOverviewQuerySchema } from "./salary.schema";

const salariesOverviewRoutes = Router();
const superAdminOnly = [requireAuth, requireSuperAdmin] as const;

salariesOverviewRoutes.get(
  "/network-overview",
  ...superAdminOnly,
  validateQuery(salaryOverviewQuerySchema),
  getNetworkSalaryOverviewHandler
);

export default salariesOverviewRoutes;
