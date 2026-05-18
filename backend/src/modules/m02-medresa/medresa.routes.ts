import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { validateBody } from "../../middleware/validate";
import {
  createMedresaHandler,
  deleteMedresaHandler,
  getMedresaDetailHandler,
  getMedresasHandler,
  updateMedresaHandler,
} from "./medresa.controller";
import {
  createMedresaSchema,
  updateMedresaSchema,
} from "./medresa.schema";

const medresaRoutes = Router();

// Get all medresas (Super Admin only)
medresaRoutes.get(
  "/",
  requireAuth,
  requireRole(["super_admin"]),
  getMedresasHandler
);

// Get medresa detail by ID (Super Admin only)
medresaRoutes.get(
  "/:id",
  requireAuth,
  requireRole(["super_admin"]),
  getMedresaDetailHandler
);

// Create new medresa (Super Admin only)
medresaRoutes.post(
  "/",
  requireAuth,
  requireRole(["super_admin"]),
  validateBody(createMedresaSchema),
  createMedresaHandler
);

// Update medresa (Super Admin only)
medresaRoutes.put(
  "/:id",
  requireAuth,
  requireRole(["super_admin"]),
  validateBody(updateMedresaSchema),
  updateMedresaHandler
);

// Deactivate medresa (Super Admin only)
medresaRoutes.delete(
  "/:id",
  requireAuth,
  requireRole(["super_admin"]),
  deleteMedresaHandler
);

export default medresaRoutes;