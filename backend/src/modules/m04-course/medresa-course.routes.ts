import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { validateBody } from "../../middleware/validate";
import { validateQuery } from "../../middleware/validate-query";
import {
  activateMedresaCourseHandler,
  assignTeacherToCourseHandler,
  deactivateMedresaCourseHandler,
  getMedresaCourseDetailHandler,
  listAvailableMasterCoursesHandler,
  listMedresaCoursesHandler,
  listMedresaTeachersHandler,
} from "./course.controller";
import {
  activateMedresaCourseSchema,
  assignTeacherToCourseSchema,
  listMedresaCoursesQuerySchema,
} from "./course.schema";

const medresaCourseRoutes = Router({ mergeParams: true });

const medresaScoped = [
  requireAuth,
  requireRole(["super_admin", "medresa_admin"], { medresaIdParam: "medresaId" }),
] as const;

const medresaScopedRead = [
  requireAuth,
  requireRole(["super_admin", "medresa_admin", "teacher"], { medresaIdParam: "medresaId" }),
] as const;

medresaCourseRoutes.get(
  "/",
  ...medresaScopedRead,
  validateQuery(listMedresaCoursesQuerySchema),
  listMedresaCoursesHandler
);

medresaCourseRoutes.post(
  "/",
  ...medresaScoped,
  validateBody(activateMedresaCourseSchema),
  activateMedresaCourseHandler
);

medresaCourseRoutes.get("/available", ...medresaScoped, listAvailableMasterCoursesHandler);

medresaCourseRoutes.get("/teachers", ...medresaScoped, listMedresaTeachersHandler);

medresaCourseRoutes.get(
  "/:medresaCourseId",
  ...medresaScopedRead,
  getMedresaCourseDetailHandler
);

medresaCourseRoutes.patch(
  "/:medresaCourseId/deactivate",
  ...medresaScoped,
  deactivateMedresaCourseHandler
);

medresaCourseRoutes.post(
  "/:medresaCourseId/teacher",
  ...medresaScoped,
  validateBody(assignTeacherToCourseSchema),
  assignTeacherToCourseHandler
);

export default medresaCourseRoutes;
