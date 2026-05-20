import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { getMedresaCourseResultsHandler } from "./grade.controller";

const medresaCourseGradeRoutes = Router();

medresaCourseGradeRoutes.get(
  "/:medresaCourseId/results",
  requireAuth,
  getMedresaCourseResultsHandler
);

export default medresaCourseGradeRoutes;
