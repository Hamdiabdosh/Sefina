import type { Request, Response } from "express";
import { createAttendanceSession } from "./attendance-session.service";
import { patchAttendanceSession } from "./attendance-session.service";
import {
  listTeacherAttendanceSessions,
  getTeacherStudentAttendance,
} from "./attendance-session.service";
import { getMedresaAttendanceOverview, getNetworkAttendanceOverview } from "./attendance-overview.service";
import type {
  CreateAttendanceSessionInput,
  ListAttendanceSessionsQuery,
  MedresaAttendanceOverviewQuery,
  NetworkAttendanceOverviewQuery,
  PatchAttendanceSessionInput,
} from "./attendance.schema";
import { dateToCalendarEt, getCalendarDateEt } from "../../lib/ethiopia-time";
import { prisma } from "../../lib/prisma";
import { mapRecord } from "./attendance.mapper";

const postConflict = ["ATTENDANCE_DUPLICATE_SESSION"] as const;
const badRequest = ["ATTENDANCE_FUTURE_DATE", "ATTENDANCE_INVALID_DATE", "ATTENDANCE_INVALID_STUDENT", "ATTENDANCE_DUPLICATE_STUDENT_PAYLOAD"] as const;
const forbidden = ["FORBIDDEN"] as const;
const medresaInactive = ["MEDRESA_INACTIVE"] as const;
const rosterEmpty = ["ATTENDANCE_NO_ROSTER"] as const;
const courseMissing = ["MEDRESA_COURSE_NOT_FOUND"] as const;

const statusForPost = (code: string): number => {
  if ((postConflict as readonly string[]).includes(code)) return 409;
  if ((courseMissing as readonly string[]).includes(code)) return 404;
  if ((medresaInactive as readonly string[]).includes(code)) return 422;
  if ((rosterEmpty as readonly string[]).includes(code)) return 422;
  if ((forbidden as readonly string[]).includes(code)) return 403;
  if ((badRequest as readonly string[]).includes(code)) return 400;
  return 400;
};

export const createAttendanceSessionHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await createAttendanceSession(
    req.user!.userId,
    req.body as CreateAttendanceSessionInput,
    req
  );
  if ("error" in result) {
    const code = result.error ?? "ATTENDANCE_INVALID_DATE";
    res.status(statusForPost(code)).json({
      success: false,
      error: { code, message: code },
    });
    return;
  }
  res.status(201).json({ success: true, data: result.session });
};

export const patchAttendanceSessionHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const sessionId = String(req.params.sessionId);
  const result = await patchAttendanceSession(
    req.user!.userId,
    sessionId,
    req.body as PatchAttendanceSessionInput,
    req
  );
  if ("error" in result) {
    const code = result.error;
    const status =
      code === "NOT_FOUND"
        ? 404
        : code === "FORBIDDEN"
          ? 403
          : code === "ATTENDANCE_LOCKED"
            ? 403
            : 400;
    res.status(status).json({
      success: false,
      error: { code, message: code },
    });
    return;
  }
  res.status(200).json({ success: true, data: result.session });
};

export const listTeacherAttendanceSessionsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await listTeacherAttendanceSessions(
    req.user!.userId,
    req.validatedQuery as ListAttendanceSessionsQuery
  );
  if ("error" in result) {
    res.status(403).json({
      success: false,
      error: { code: result.error, message: result.error },
    });
    return;
  }
  res.status(200).json({ success: true, data: result });
};

export const getTeacherStudentAttendanceHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const studentId = String(req.params.studentId);
  const result = await getTeacherStudentAttendance(req.user!.userId, studentId);
  if ("error" in result) {
    const status = result.error === "FORBIDDEN" ? 403 : 404;
    res.status(status).json({
      success: false,
      error: {
        code: result.error,
        message: result.error === "FORBIDDEN" ? "Insufficient permissions" : "Student not found",
      },
    });
    return;
  }
  res.status(200).json({ success: true, data: result.data });
};

export const getNetworkAttendanceOverviewHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const query = req.validatedQuery as NetworkAttendanceOverviewQuery;
  const result = await getNetworkAttendanceOverview(query);
  if ("error" in result) {
    res.status(400).json({
      success: false,
      error: { code: result.error, message: result.error },
    });
    return;
  }
  res.status(200).json({ success: true, data: result });
};

/** GET /sessions/today-session — shortcut for UX (medresaCourseId required). */
export const getTodaySessionForCourseHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const medresaCourseId = String(req.query.medresaCourseId ?? "");
  if (!medresaCourseId) {
    res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "medresaCourseId is required" },
    });
    return;
  }
  const today = getCalendarDateEt();
  const list = await listTeacherAttendanceSessions(req.user!.userId, {
    medresaCourseId,
    from: today,
    to: today,
  });
  if ("error" in list) {
    res.status(403).json({
      success: false,
      error: { code: list.error, message: list.error },
    });
    return;
  }
  const session = list.items[0] ?? null;
  if (!session) {
    res.status(200).json({ success: true, data: { session: null } });
    return;
  }
  const full = await prisma.attendanceSession.findFirst({
    where: { id: session.id, deleted_at: null },
    include: {
      records: { where: { deleted_at: null }, orderBy: { student_id: "asc" } },
      medresa_course: { select: { medresa_id: true } },
    },
  });
  if (!full) {
    res.status(200).json({ success: true, data: { session: null } });
    return;
  }
  res.status(200).json({
    success: true,
    data: {
      session: {
        id: full.id,
        medresaCourseId: full.medresa_course_id,
        medresaId: full.medresa_course.medresa_id,
        date: dateToCalendarEt(full.date),
        submittedAt: full.submitted_at ? full.submitted_at.toISOString() : null,
        isLocked: full.is_locked,
        records: full.records.map(mapRecord),
      },
    },
  });
};

export const getMedresaAttendanceOverviewHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const medresaId = String(req.params.medresaId);
  const result = await getMedresaAttendanceOverview(
    medresaId,
    req.validatedQuery as MedresaAttendanceOverviewQuery
  );
  if ("error" in result) {
    const status = result.error === "MEDRESA_INACTIVE" ? 422 : 400;
    res.status(status).json({
      success: false,
      error: {
        code: result.error,
        message: result.error === "MEDRESA_INACTIVE" ? "Medresa is not active" : result.error,
      },
    });
    return;
  }
  res.status(200).json({ success: true, data: result });
};
