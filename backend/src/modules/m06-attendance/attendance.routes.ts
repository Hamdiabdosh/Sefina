import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { requireAttendanceWriter } from "../../middleware/attendance-writer";
import { validateBody } from "../../middleware/validate";
import { validateQuery } from "../../middleware/validate-query";
import {
  createAttendanceSessionHandler,
  getNetworkAttendanceOverviewHandler,
  getViewerStudentAttendanceHandler,
  getTodaySessionForMedresaHandler,
  listWriterAttendanceSessionsHandler,
  patchAttendanceSessionHandler,
  listAttendanceRosterHandler,
} from "./attendance.controller";
import {
  attendanceRosterQuerySchema,
  createAttendanceSessionSchema,
  listAttendanceSessionsQuerySchema,
  networkAttendanceOverviewQuerySchema,
  patchAttendanceSessionSchema,
} from "./attendance.schema";

const attendanceRoutes = Router();

const writerChain = [requireAuth, requireAttendanceWriter] as const;

const superAdminAttendance = [requireAuth, requireRole(["super_admin"])] as const;

attendanceRoutes.get(
  "/roster",
  ...writerChain,
  validateQuery(attendanceRosterQuerySchema),
  listAttendanceRosterHandler
);

attendanceRoutes.get("/students/:studentId", requireAuth, getViewerStudentAttendanceHandler);

attendanceRoutes.get(
  "/sessions/today-session",
  ...writerChain,
  getTodaySessionForMedresaHandler
);

attendanceRoutes.get(
  "/sessions",
  ...writerChain,
  validateQuery(listAttendanceSessionsQuerySchema),
  listWriterAttendanceSessionsHandler
);

attendanceRoutes.post(
  "/sessions",
  ...writerChain,
  validateBody(createAttendanceSessionSchema),
  createAttendanceSessionHandler
);

attendanceRoutes.patch(
  "/sessions/:sessionId",
  ...writerChain,
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
