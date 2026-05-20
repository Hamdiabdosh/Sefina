import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { requireFeeAccess } from "../../middleware/fee-access";
import { validateQuery } from "../../middleware/validate-query";
import {
  getFeeCollectionHandler,
  getMedresaFeeOverviewHandler,
  getStudentFeeHistoryHandler,
} from "./fee.controller";
import {
  feeCollectionQuerySchema,
  feeOverviewQuerySchema,
} from "./fee.schema";

const medresaFeeRoutes = Router({ mergeParams: true });

const medresaReaders = [
  requireAuth,
  requireFeeAccess,
  requireRole(["super_admin", "medresa_admin"], { medresaIdParam: "medresaId" }),
] as const;

medresaFeeRoutes.get(
  "/collection",
  ...medresaReaders,
  validateQuery(feeCollectionQuerySchema),
  getFeeCollectionHandler
);

medresaFeeRoutes.get(
  "/overview",
  ...medresaReaders,
  validateQuery(feeOverviewQuerySchema),
  getMedresaFeeOverviewHandler
);

medresaFeeRoutes.get(
  "/students/:studentId/history",
  ...medresaReaders,
  getStudentFeeHistoryHandler
);

export default medresaFeeRoutes;
