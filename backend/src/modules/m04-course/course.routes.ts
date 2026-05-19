import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { validateBody } from "../../middleware/validate";
import { validateQuery } from "../../middleware/validate-query";
import {
  createCourseHandler,
  deactivateCourseHandler,
  getCourseHandler,
  listCoursesHandler,
  reactivateCourseHandler,
  updateCourseHandler,
} from "./course.controller";
import {
  createCourseSchema,
  listCoursesQuerySchema,
  updateCourseSchema,
} from "./course.schema";

const courseRoutes = Router();

const superAdminOnly = [requireAuth, requireRole(["super_admin"])] as const;

courseRoutes.get(
  "/",
  ...superAdminOnly,
  validateQuery(listCoursesQuerySchema),
  listCoursesHandler
);

courseRoutes.post(
  "/",
  ...superAdminOnly,
  validateBody(createCourseSchema),
  createCourseHandler
);

courseRoutes.get("/:id", ...superAdminOnly, getCourseHandler);

courseRoutes.patch(
  "/:id",
  ...superAdminOnly,
  validateBody(updateCourseSchema),
  updateCourseHandler
);

courseRoutes.patch("/:id/deactivate", ...superAdminOnly, deactivateCourseHandler);

courseRoutes.patch("/:id/reactivate", ...superAdminOnly, reactivateCourseHandler);

export default courseRoutes;
