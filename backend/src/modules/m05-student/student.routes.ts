import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { validateBody } from "../../middleware/validate";
import {
  assignStudentCourseHandler,
  getStudentHandler,
  getStudentPhotoHandler,
  listTransferDestinationsHandler,
  removeStudentCourseHandler,
  transferStudentHandler,
  updateStudentHandler,
  uploadStudentPhotoHandler,
} from "./student.controller";
import {
  assignStudentCourseSchema,
  transferStudentSchema,
  updateStudentSchema,
} from "./student.schema";

const studentRoutes = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

studentRoutes.get(
  "/transfer-destinations",
  requireAuth,
  requireRole(["super_admin", "medresa_admin"]),
  listTransferDestinationsHandler
);

studentRoutes.get("/:id/photo", requireAuth, getStudentPhotoHandler);

studentRoutes.post(
  "/:id/photo",
  requireAuth,
  upload.single("photo"),
  uploadStudentPhotoHandler
);

studentRoutes.get("/:id", requireAuth, getStudentHandler);

studentRoutes.patch(
  "/:id",
  requireAuth,
  upload.single("photo"),
  validateBody(updateStudentSchema),
  updateStudentHandler
);

studentRoutes.post(
  "/:id/courses",
  requireAuth,
  validateBody(assignStudentCourseSchema),
  assignStudentCourseHandler
);

studentRoutes.delete(
  "/:id/courses/:studentCourseId",
  requireAuth,
  removeStudentCourseHandler
);

studentRoutes.post(
  "/:id/transfer",
  requireAuth,
  validateBody(transferStudentSchema),
  transferStudentHandler
);

export default studentRoutes;
