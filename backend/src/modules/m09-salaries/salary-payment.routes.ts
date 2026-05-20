import { Router } from "express";
import { requireAuth, requireSuperAdmin } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { validateQuery } from "../../middleware/validate-query";
import {
  getSalaryPaymentListHandler,
  recordSalaryPaymentHandler,
} from "./salary.controller";
import {
  recordSalaryPaymentSchema,
  salaryPaymentListQuerySchema,
} from "./salary.schema";

const salaryPaymentRoutes = Router();
const superAdminOnly = [requireAuth, requireSuperAdmin] as const;

salaryPaymentRoutes.get(
  "/",
  ...superAdminOnly,
  validateQuery(salaryPaymentListQuerySchema),
  getSalaryPaymentListHandler
);
salaryPaymentRoutes.post(
  "/",
  ...superAdminOnly,
  validateBody(recordSalaryPaymentSchema),
  recordSalaryPaymentHandler
);

export default salaryPaymentRoutes;
