import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { validateBody } from "../../middleware/validate";
import { validateQuery } from "../../middleware/validate-query";
import {
  approveGradeEditRequestHandler,
  listGradeEditRequestsHandler,
  rejectGradeEditRequestHandler,
} from "./grade.controller";
import {
  listGradeEditRequestsQuerySchema,
  rejectGradeEditRequestSchema,
} from "./grade.schema";

const gradeEditRequestRoutes = Router();

const approverChain = [requireAuth, requireRole(["super_admin", "medresa_admin"])] as const;

gradeEditRequestRoutes.get(
  "/",
  ...approverChain,
  validateQuery(listGradeEditRequestsQuerySchema),
  listGradeEditRequestsHandler
);

gradeEditRequestRoutes.patch(
  "/:id/approve",
  ...approverChain,
  approveGradeEditRequestHandler
);

gradeEditRequestRoutes.patch(
  "/:id/reject",
  ...approverChain,
  validateBody(rejectGradeEditRequestSchema),
  rejectGradeEditRequestHandler
);

export default gradeEditRequestRoutes;
