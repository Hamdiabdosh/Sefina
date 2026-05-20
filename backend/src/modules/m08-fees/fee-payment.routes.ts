import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { requireFeeAccess } from "../../middleware/fee-access";
import { requireFeeRecorder } from "../../middleware/fee-recorder";
import { validateBody } from "../../middleware/validate";
import { recordFeePaymentHandler, voidFeePaymentHandler } from "./fee.controller";
import { recordFeePaymentSchema, voidFeePaymentSchema } from "./fee.schema";

const feePaymentRoutes = Router();

const recorderChain = [requireAuth, requireFeeAccess, requireFeeRecorder] as const;
const superAdminOnly = [requireAuth, requireRole(["super_admin"])] as const;

feePaymentRoutes.post("/", ...recorderChain, validateBody(recordFeePaymentSchema), recordFeePaymentHandler);

feePaymentRoutes.patch(
  "/:id/void",
  ...superAdminOnly,
  validateBody(voidFeePaymentSchema),
  voidFeePaymentHandler
);

export default feePaymentRoutes;
