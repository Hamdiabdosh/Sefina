import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { validateQuery } from "../../middleware/validate-query";
import { getMedresaAttendanceOverviewHandler } from "./attendance.controller";
import { medresaAttendanceOverviewQuerySchema } from "./attendance.schema";

const medresaAttendanceRoutes = Router({ mergeParams: true });

const medresaReaders = [
  requireAuth,
  requireRole(["super_admin", "medresa_admin"], { medresaIdParam: "medresaId" }),
] as const;

medresaAttendanceRoutes.get(
  "/overview",
  ...medresaReaders,
  validateQuery(medresaAttendanceOverviewQuerySchema),
  getMedresaAttendanceOverviewHandler
);

export default medresaAttendanceRoutes;
