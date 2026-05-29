import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireGradeWriter } from "../../middleware/grade-writer";
import { validateBody } from "../../middleware/validate";
import {
  batchGradesHandler,
  createGradeEditRequestHandler,
  createGradeHandler,
  listCourseGradesEntryHandler,
  listTeacherCoursesHandler,
  listTeacherGradeEditRequestsHandler,
} from "./grade.controller";
import {
  batchGradesSchema,
  createGradeEditRequestSchema,
  createGradeSchema,
} from "./grade.schema";

const gradeRoutes = Router();

const writerChain = [requireAuth, requireGradeWriter] as const;

gradeRoutes.get("/edit-requests", ...writerChain, listTeacherGradeEditRequestsHandler);

gradeRoutes.get("/my-courses", ...writerChain, listTeacherCoursesHandler);

gradeRoutes.get("/roster", ...writerChain, listCourseGradesEntryHandler);

gradeRoutes.post(
  "/",
  ...writerChain,
  validateBody(createGradeSchema),
  createGradeHandler
);

gradeRoutes.post(
  "/batch",
  ...writerChain,
  validateBody(batchGradesSchema),
  batchGradesHandler
);

gradeRoutes.post(
  "/:gradeId/edit-requests",
  ...writerChain,
  validateBody(createGradeEditRequestSchema),
  createGradeEditRequestHandler
);

export default gradeRoutes;
