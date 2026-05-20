import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { requireFeeAccess } from "../../middleware/fee-access";
import { validateBody } from "../../middleware/validate";
import {
  createFeeStructureHandler,
  getActiveFeeStructureHandler,
  listFeeStructuresHandler,
} from "./fee.controller";
import { createFeeStructureSchema } from "./fee.schema";

const feeStructureRoutes = Router();

const feeReaders = [requireAuth, requireFeeAccess] as const;
const superAdminOnly = [requireAuth, requireRole(["super_admin"])] as const;

feeStructureRoutes.get("/", ...feeReaders, listFeeStructuresHandler);
feeStructureRoutes.get("/active", ...feeReaders, getActiveFeeStructureHandler);
feeStructureRoutes.post(
  "/",
  ...superAdminOnly,
  validateBody(createFeeStructureSchema),
  createFeeStructureHandler
);

export default feeStructureRoutes;
