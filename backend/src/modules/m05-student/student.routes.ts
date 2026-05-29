import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { validateBody } from "../../middleware/validate";
import {
  assignStudentCourseHandler,
  getStudentHandler,
  getStudentPhotoHandler,
  graduateStudentHandler,
  listTransferDestinationsHandler,
  reactivateStudentHandler,
  removeStudentCourseHandler,
  transferStudentHandler,
  updateStudentHandler,
  uploadStudentPhotoHandler,
  withdrawStudentHandler,
} from "./student.controller";
import { getStudentResultsHandler } from "../m07-grades/grade.controller";
import {
  assignStudentCourseSchema,
  graduateStudentSchema,
  reactivateStudentSchema,
  transferStudentSchema,
  updateStudentSchema,
  withdrawStudentSchema,
} from "./student.schema";

const studentRoutes = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

studentRoutes.get(
  "/transfer-destinations",
  requireAuth,
  requireRole(["super_admin", "medresa_admin"]),
  listTransferDestinationsHandler
);

studentRoutes.get("/:id/results", requireAuth, getStudentResultsHandler);

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

studentRoutes.post(
  "/:id/withdraw",
  requireAuth,
  validateBody(withdrawStudentSchema),
  withdrawStudentHandler
);

studentRoutes.post(
  "/:id/graduate",
  requireAuth,
  validateBody(graduateStudentSchema),
  graduateStudentHandler
);

studentRoutes.post(
  "/:id/reactivate",
  requireAuth,
  validateBody(reactivateStudentSchema),
  reactivateStudentHandler
);

export default studentRoutes;
