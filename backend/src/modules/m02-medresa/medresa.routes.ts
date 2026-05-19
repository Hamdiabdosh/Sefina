import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { validateBody } from "../../middleware/validate";
import {
  createMedresaHandler,
  deactivateMedresaHandler,
  getMedresaDetailHandler,
  getMedresasHandler,
  reactivateMedresaHandler,
  updateMedresaHandler,
} from "./medresa.controller";
import {
  createMedresaSchema,
  updateMedresaSchema,
} from "./medresa.schema";

const medresaRoutes = Router();

const superAdminOnly = [requireAuth, requireRole(["super_admin"])] as const;

medresaRoutes.get("/", ...superAdminOnly, getMedresasHandler);

medresaRoutes.get("/:id", ...superAdminOnly, getMedresaDetailHandler);

medresaRoutes.post(
  "/",
  ...superAdminOnly,
  validateBody(createMedresaSchema),
  createMedresaHandler
);

medresaRoutes.put(
  "/:id",
  ...superAdminOnly,
  validateBody(updateMedresaSchema),
  updateMedresaHandler
);

medresaRoutes.patch("/:id/deactivate", ...superAdminOnly, deactivateMedresaHandler);

medresaRoutes.patch("/:id/reactivate", ...superAdminOnly, reactivateMedresaHandler);

export default medresaRoutes;
