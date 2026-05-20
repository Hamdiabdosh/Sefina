import { Router } from "express";
import { requireAuth, requireSuperAdmin } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import {
  createSalaryRankHandler,
  deactivateSalaryRankHandler,
  listSalaryRankHistoryHandler,
  listSalaryRanksHandler,
  patchSalaryRankHandler,
} from "./salary.controller";
import { createSalaryRankSchema, patchSalaryRankSchema } from "./salary.schema";

const salaryRankRoutes = Router();
const superAdminOnly = [requireAuth, requireSuperAdmin] as const;

salaryRankRoutes.get("/", ...superAdminOnly, listSalaryRanksHandler);
salaryRankRoutes.get("/history", ...superAdminOnly, listSalaryRankHistoryHandler);
salaryRankRoutes.post(
  "/",
  ...superAdminOnly,
  validateBody(createSalaryRankSchema),
  createSalaryRankHandler
);
salaryRankRoutes.patch(
  "/:id",
  ...superAdminOnly,
  validateBody(patchSalaryRankSchema),
  patchSalaryRankHandler
);
salaryRankRoutes.patch("/:id/deactivate", ...superAdminOnly, deactivateSalaryRankHandler);

export default salaryRankRoutes;
