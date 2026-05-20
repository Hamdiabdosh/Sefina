import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { validateQuery } from "../../middleware/validate-query";
import {
  createStudentHandler,
  listMedresaStudentsHandler,
} from "./student.controller";
import { listStudentsQuerySchema } from "./student.schema";

const medresaStudentRoutes = Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

const medresaScoped = [
  requireAuth,
  requireRole(["super_admin", "medresa_admin"], { medresaIdParam: "medresaId" }),
] as const;

medresaStudentRoutes.get(
  "/",
  ...medresaScoped,
  validateQuery(listStudentsQuerySchema),
  listMedresaStudentsHandler
);

medresaStudentRoutes.post(
  "/",
  ...medresaScoped,
  upload.single("photo"),
  createStudentHandler
);

export default medresaStudentRoutes;
