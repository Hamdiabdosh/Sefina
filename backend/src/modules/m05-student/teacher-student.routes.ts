import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { listTeacherStudentsHandler } from "./student.controller";

const teacherStudentRoutes = Router();

teacherStudentRoutes.get(
  "/",
  requireAuth,
  requireRole(["teacher"]),
  listTeacherStudentsHandler
);

export default teacherStudentRoutes;
