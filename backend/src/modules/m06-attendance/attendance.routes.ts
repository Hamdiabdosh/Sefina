import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { validateBody } from "../../middleware/validate";
import { validateQuery } from "../../middleware/validate-query";
import {
  createAttendanceSessionHandler,
  getNetworkAttendanceOverviewHandler,
  getTeacherStudentAttendanceHandler,
  getTodaySessionForCourseHandler,
  listTeacherAttendanceSessionsHandler,
  patchAttendanceSessionHandler,
} from "./attendance.controller";
import {
  createAttendanceSessionSchema,
  listAttendanceSessionsQuerySchema,
  networkAttendanceOverviewQuerySchema,
  patchAttendanceSessionSchema,
} from "./attendance.schema";

const attendanceRoutes = Router();

const teacherAttendance = [
  requireAuth,
  requireRole(["teacher"]),
] as const;

const superAdminAttendance = [
  requireAuth,
  requireRole(["super_admin"]),
] as const;

attendanceRoutes.get(
  "/students/:studentId",
  ...teacherAttendance,
  getTeacherStudentAttendanceHandler
);

attendanceRoutes.get(
  "/sessions/today-session",
  ...teacherAttendance,
  getTodaySessionForCourseHandler
);

attendanceRoutes.get(
  "/sessions",
  ...teacherAttendance,
  validateQuery(listAttendanceSessionsQuerySchema),
  listTeacherAttendanceSessionsHandler
);

attendanceRoutes.post(
  "/sessions",
  ...teacherAttendance,
  validateBody(createAttendanceSessionSchema),
  createAttendanceSessionHandler
);

attendanceRoutes.patch(
  "/sessions/:sessionId",
  ...teacherAttendance,
  validateBody(patchAttendanceSessionSchema),
  patchAttendanceSessionHandler
);

attendanceRoutes.get(
  "/network-overview",
  ...superAdminAttendance,
  validateQuery(networkAttendanceOverviewQuerySchema),
  getNetworkAttendanceOverviewHandler
);

export default attendanceRoutes;
