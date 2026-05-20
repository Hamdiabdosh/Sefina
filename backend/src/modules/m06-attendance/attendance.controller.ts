import type { Request, Response } from "express";
import { Prisma } from "../../../prisma/generated/prisma/client";
import {
  createAttendanceSession,
  patchAttendanceSession,
  listWriterAttendanceSessions,
  getViewerStudentAttendance,
  listAttendanceRoster,
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
const badRequest = [
  "ATTENDANCE_FUTURE_DATE",
  "ATTENDANCE_INVALID_DATE",
  "ATTENDANCE_INVALID_STUDENT",
  "ATTENDANCE_DUPLICATE_STUDENT_PAYLOAD",
] as const;
const forbidden = ["FORBIDDEN"] as const;
const medresaInactive = ["MEDRESA_INACTIVE"] as const;
const rosterEmpty = ["ATTENDANCE_NO_ROSTER"] as const;

const statusForPost = (code: string): number => {
  if ((postConflict as readonly string[]).includes(code)) return 409;
  if ((medresaInactive as readonly string[]).includes(code)) return 422;
  if ((rosterEmpty as readonly string[]).includes(code)) return 422;
  if ((forbidden as readonly string[]).includes(code)) return 403;
  if ((badRequest as readonly string[]).includes(code)) return 400;
  return 400;
};

const prismaSyncInstructions =
  "From the backend folder run: `npx prisma migrate deploy && npx prisma generate`, then restart the server. If `prisma generate` fails with permission errors on `prisma/generated/`, fix ownership (e.g. `sudo chown -R \"$(whoami)\" prisma/generated`).";

function attendancePrismaErrorResponse(res: Response, err: unknown): boolean {
  if (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientValidationError
  ) {
    console.error("[attendance][prisma]", err);
    const isValidation = err instanceof Prisma.PrismaClientValidationError;
    res.status(503).json({
      success: false,
      error: {
        code:
          err instanceof Prisma.PrismaClientKnownRequestError ? err.code : "PRISMA_VALIDATION_ERROR",
        message: isValidation
          ? `Prisma rejected the query — the Prisma client, schema, or database is out of sync. ${prismaSyncInstructions}`
          : `${err.message} ${prismaSyncInstructions}`,
        ...(process.env.NODE_ENV !== "production" ? { detail: err.message } : {}),
      },
    });
    return true;
  }
  return false;
}

export const createAttendanceSessionHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
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
  } catch (err) {
    if (attendancePrismaErrorResponse(res, err)) return;
    console.error("[attendance] createAttendanceSession", err);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "Unexpected error",
      },
    });
  }
};

export const patchAttendanceSessionHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
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
  } catch (err) {
    if (attendancePrismaErrorResponse(res, err)) return;
    console.error("[attendance] patchAttendanceSession", err);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "Unexpected error",
      },
    });
  }
};

export const listWriterAttendanceSessionsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await listWriterAttendanceSessions(
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

export const getViewerStudentAttendanceHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const studentId = String(req.params.studentId);
  const result = await getViewerStudentAttendance(req, studentId);
  if ("error" in result) {
    const status = result.error === "FORBIDDEN" ? 403 : 404;
    res.status(status).json({
      success: false,
      error: {
        code: result.error,
        message:
          result.error === "FORBIDDEN" ? "Insufficient permissions" : "Student not found",
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

/** GET /sessions/today-session — Ethiopian “today”; medresaId required. */
export const getTodaySessionForMedresaHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const medresaId = String(req.query.medresaId ?? "");
  if (!medresaId) {
    res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "medresaId is required" },
    });
    return;
  }
  const today = getCalendarDateEt();
  const list = await listWriterAttendanceSessions(req.user!.userId, {
    medresaId,
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
      medresa: { select: { id: true } },
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
        medresaId: full.medresa_id,
        date: dateToCalendarEt(full.date),
        submittedAt: full.submitted_at ? full.submitted_at.toISOString() : null,
        teacherMarkedAt: full.teacher_marked_at ? full.teacher_marked_at.toISOString() : null,
        adminMarkedAt: full.admin_marked_at ? full.admin_marked_at.toISOString() : null,
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

export const listAttendanceRosterHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const medresaId = (req.validatedQuery as { medresaId: string }).medresaId;
  const result = await listAttendanceRoster(req.user!.userId, medresaId);
  if ("error" in result) {
    const status =
      result.error === "FORBIDDEN" ? 403 : result.error === "MEDRESA_INACTIVE" ? 422 : 400;
    res.status(status).json({
      success: false,
      error: { code: result.error, message: result.error },
    });
    return;
  }
  res.status(200).json({ success: true, data: result });
};
