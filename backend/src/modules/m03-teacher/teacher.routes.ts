import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { validateBody } from "../../middleware/validate";
import { validateQuery } from "../../middleware/validate-query";
import {
  assignMedresaHandler,
  bulkAssignMedresaHandler,
  createTeacherHandler,
  deactivateTeacherHandler,
  getTeacherHandler,
  getTeacherMeHandler,
  getTeacherPhotoHandler,
  listTeachersHandler,
  reactivateTeacherHandler,
  removeFromMedresaHandler,
  updateAssignmentRoleHandler,
  updateTeacherHandler,
  uploadTeacherPhotoHandler,
} from "./teacher.controller";
import {
  assignMedresaSchema,
  bulkAssignMedresaSchema,
  createTeacherSchema,
  listTeachersQuerySchema,
  updateAssignmentRoleSchema,
  updateTeacherSchema,
} from "./teacher.schema";

const teacherRoutes = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

const superAdminOnly = [requireAuth, requireRole(["super_admin"])] as const;

teacherRoutes.get("/me", requireAuth, getTeacherMeHandler);

teacherRoutes.get(
  "/",
  ...superAdminOnly,
  validateQuery(listTeachersQuerySchema),
  listTeachersHandler
);

teacherRoutes.post(
  "/",
  ...superAdminOnly,
  validateBody(createTeacherSchema),
  createTeacherHandler
);

teacherRoutes.get("/:id/photo", requireAuth, getTeacherPhotoHandler);

teacherRoutes.post(
  "/:id/photo",
  ...superAdminOnly,
  upload.single("photo"),
  uploadTeacherPhotoHandler
);

teacherRoutes.get("/:id", requireAuth, getTeacherHandler);

teacherRoutes.patch(
  "/:id",
  ...superAdminOnly,
  validateBody(updateTeacherSchema),
  updateTeacherHandler
);

teacherRoutes.patch("/:id/deactivate", ...superAdminOnly, deactivateTeacherHandler);

teacherRoutes.patch("/:id/reactivate", ...superAdminOnly, reactivateTeacherHandler);

teacherRoutes.post(
  "/:id/medresas/bulk",
  ...superAdminOnly,
  validateBody(bulkAssignMedresaSchema),
  bulkAssignMedresaHandler
);

teacherRoutes.post(
  "/:id/medresas",
  ...superAdminOnly,
  validateBody(assignMedresaSchema),
  assignMedresaHandler
);

teacherRoutes.patch(
  "/:id/medresas/:medresaId",
  ...superAdminOnly,
  validateBody(updateAssignmentRoleSchema),
  updateAssignmentRoleHandler
);

teacherRoutes.delete(
  "/:id/medresas/:medresaId",
  ...superAdminOnly,
  removeFromMedresaHandler
);

export default teacherRoutes;
