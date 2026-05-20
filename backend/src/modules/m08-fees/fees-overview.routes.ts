import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { validateQuery } from "../../middleware/validate-query";
import { getNetworkFeeOverviewHandler } from "./fee.controller";
import { networkFeeOverviewQuerySchema } from "./fee.schema";

const feesOverviewRoutes = Router();

feesOverviewRoutes.get(
  "/network-overview",
  requireAuth,
  requireRole(["super_admin"]),
  validateQuery(networkFeeOverviewQuerySchema),
  getNetworkFeeOverviewHandler
);

export default feesOverviewRoutes;
