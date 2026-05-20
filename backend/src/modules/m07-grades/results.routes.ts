import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { getNetworkResultsOverviewHandler } from "./grade.controller";

const resultsRoutes = Router();

resultsRoutes.get(
  "/network-overview",
  requireAuth,
  requireRole(["super_admin"]),
  getNetworkResultsOverviewHandler
);

export default resultsRoutes;
