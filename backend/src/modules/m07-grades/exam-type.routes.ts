import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { validateBody } from "../../middleware/validate";
import { validateQuery } from "../../middleware/validate-query";
import {
  createExamTypeHandler,
  getExamTypeHandler,
  listExamTypesHandler,
  updateExamTypeHandler,
} from "./grade.controller";
import {
  createExamTypeSchema,
  listExamTypesQuerySchema,
  updateExamTypeSchema,
} from "./grade.schema";

const examTypeRoutes = Router();

const superAdminOnly = [requireAuth, requireRole(["super_admin"])] as const;
const authenticated = [requireAuth] as const;

examTypeRoutes.get(
  "/",
  ...authenticated,
  validateQuery(listExamTypesQuerySchema),
  listExamTypesHandler
);

examTypeRoutes.post(
  "/",
  ...superAdminOnly,
  validateBody(createExamTypeSchema),
  createExamTypeHandler
);

examTypeRoutes.get("/:id", ...authenticated, getExamTypeHandler);

examTypeRoutes.patch(
  "/:id",
  ...superAdminOnly,
  validateBody(updateExamTypeSchema),
  updateExamTypeHandler
);

export default examTypeRoutes;
