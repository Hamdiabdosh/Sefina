import type { Request, Response } from "express";
import {
  approveGradeEditRequest,
  createGradeEditRequest,
  listGradeEditRequests,
  rejectGradeEditRequest,
} from "./grade-edit.service";
import {
  batchCreateGrades,
  createGrade,
  listCourseGradesForEntry,
  listTeacherAssignedCourses,
} from "./grade-entry.service";
import {
  createExamType,
  getExamTypeById,
  listExamTypes,
  updateExamType,
} from "./exam-type.service";
import {
  getMedresaCourseResults,
  getMedresaResultsOverview,
  getNetworkResultsOverview,
  getStudentResults,
} from "./grade-results.service";
import type {
  BatchGradesInput,
  CreateExamTypeInput,
  CreateGradeEditRequestInput,
  CreateGradeInput,
  ListExamTypesQuery,
  ListGradeEditRequestsQuery,
  RejectGradeEditRequestInput,
  UpdateExamTypeInput,
} from "./grade.schema";

const getIdParam = (req: Request): string => String(req.params.id);
const getGradeIdParam = (req: Request): string => String(req.params.gradeId);
const getStudentIdParam = (req: Request): string =>
  String(req.params.studentId ?? req.params.id);
const getMedresaCourseIdParam = (req: Request): string => String(req.params.medresaCourseId);
const getMedresaIdParam = (req: Request): string => String(req.params.medresaId);

const err = (res: Response, status: number, code: string, message: string) => {
  res.status(status).json({ success: false, error: { code, message } });
};

export const listExamTypesHandler = async (req: Request, res: Response): Promise<void> => {
  const data = await listExamTypes(req.validatedQuery as ListExamTypesQuery);
  res.status(200).json({ success: true, data });
};

export const createExamTypeHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await createExamType(req.body as CreateExamTypeInput, req.user!.userId);
  if ("error" in result) {
    err(res, 400, result.error, "Active exam type weights must sum to 100%");
    return;
  }
  res.status(201).json({ success: true, data: result.examType });
};

export const updateExamTypeHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await updateExamType(
    getIdParam(req),
    req.body as UpdateExamTypeInput,
    req.user!.userId
  );
  if ("error" in result) {
    const code = result.error ?? "EXAM_TYPE_UPDATE_FAILED";
    if (code === "EXAM_TYPE_NOT_FOUND") {
      err(res, 404, code, "Exam type not found");
      return;
    }
    err(res, 400, code, "Active exam type weights must sum to 100%");
    return;
  }
  res.status(200).json({ success: true, data: result.examType });
};

export const getExamTypeHandler = async (req: Request, res: Response): Promise<void> => {
  const row = await getExamTypeById(getIdParam(req));
  if (!row) {
    err(res, 404, "EXAM_TYPE_NOT_FOUND", "Exam type not found");
    return;
  }
  res.status(200).json({ success: true, data: row });
};

export const createGradeHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await createGrade(req.user!.userId, req.body as CreateGradeInput, req);
  if ("error" in result) {
    const code = result.error ?? "GRADE_CREATE_FAILED";
    const status =
      code === "FORBIDDEN"
        ? 403
        : code === "GRADE_ALREADY_EXISTS"
          ? 409
          : code === "SCORE_OUT_OF_RANGE"
            ? 400
            : 400;
    err(res, status, code, code);
    return;
  }
  res.status(201).json({ success: true, data: result.grade });
};

export const batchGradesHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await batchCreateGrades(
    req.user!.userId,
    req.body as BatchGradesInput,
    req
  );
  if ("error" in result && !("created" in result)) {
    const code = result.error ?? "BATCH_GRADE_FAILED";
    const status = code === "FORBIDDEN" ? 403 : 400;
    err(res, status, code, code);
    return;
  }
  res.status(201).json({ success: true, data: result });
};

export const listTeacherCoursesHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await listTeacherAssignedCourses(req.user!.userId);
  if ("error" in result) {
    err(res, 403, result.error ?? "FORBIDDEN", "Forbidden");
    return;
  }
  res.status(200).json({ success: true, data: result });
};

export const listCourseGradesEntryHandler = async (req: Request, res: Response): Promise<void> => {
  const medresaCourseId = String(req.query.medresaCourseId ?? "");
  const examTypeId = String(req.query.examTypeId ?? "");
  if (!medresaCourseId || !examTypeId) {
    err(res, 400, "INVALID_QUERY", "medresaCourseId and examTypeId are required");
    return;
  }
  const result = await listCourseGradesForEntry(
    req.user!.userId,
    medresaCourseId,
    examTypeId
  );
  if ("error" in result) {
    err(res, 403, result.error ?? "FORBIDDEN", "Forbidden");
    return;
  }
  res.status(200).json({ success: true, data: result });
};

export const createGradeEditRequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await createGradeEditRequest(
    req.user!.userId,
    getGradeIdParam(req),
    req.body as CreateGradeEditRequestInput,
    req
  );
  if ("error" in result) {
    const status =
      result.error === "FORBIDDEN"
        ? 403
        : result.error === "GRADE_NOT_FOUND"
          ? 404
          : result.error === "PENDING_REQUEST_EXISTS"
            ? 409
            : 400;
    const code = result.error ?? "EDIT_REQUEST_FAILED";
    err(res, status, code, code);
    return;
  }
  res.status(201).json({ success: true, data: result.request });
};

export const listGradeEditRequestsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await listGradeEditRequests(
    req,
    req.validatedQuery as ListGradeEditRequestsQuery
  );
  if ("error" in result) {
    err(res, 403, result.error ?? "FORBIDDEN", "Forbidden");
    return;
  }
  res.status(200).json({ success: true, data: result });
};

export const approveGradeEditRequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await approveGradeEditRequest(req, getIdParam(req));
  if ("error" in result) {
    const status =
      result.error === "FORBIDDEN" ? 403 : result.error === "REQUEST_NOT_FOUND" ? 404 : 400;
    const code = result.error ?? "APPROVE_FAILED";
    err(res, status, code, code);
    return;
  }
  res.status(200).json({ success: true, data: result });
};

export const rejectGradeEditRequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await rejectGradeEditRequest(
    req,
    getIdParam(req),
    req.body as RejectGradeEditRequestInput
  );
  if ("error" in result) {
    const status =
      result.error === "FORBIDDEN" ? 403 : result.error === "REQUEST_NOT_FOUND" ? 404 : 400;
    const code = result.error ?? "REJECT_FAILED";
    err(res, status, code, code);
    return;
  }
  res.status(200).json({ success: true, data: result });
};

export const getStudentResultsHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await getStudentResults(req, getStudentIdParam(req));
  if ("error" in result) {
    const status = result.error === "FORBIDDEN" ? 403 : 404;
    const code = result.error ?? "STUDENT_RESULTS_FAILED";
    err(res, status, code, code);
    return;
  }
  res.status(200).json({ success: true, data: result });
};

export const getMedresaCourseResultsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await getMedresaCourseResults(req, getMedresaCourseIdParam(req));
  if ("error" in result) {
    const status = result.error === "FORBIDDEN" ? 403 : 404;
    const code = result.error ?? "COURSE_RESULTS_FAILED";
    err(res, status, code, code);
    return;
  }
  res.status(200).json({ success: true, data: result });
};

export const getMedresaResultsOverviewHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await getMedresaResultsOverview(req, getMedresaIdParam(req));
  if ("error" in result) {
    err(res, 403, result.error ?? "FORBIDDEN", "Forbidden");
    return;
  }
  res.status(200).json({ success: true, data: result });
};

export const getNetworkResultsOverviewHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await getNetworkResultsOverview(req);
  if ("error" in result) {
    err(res, 403, result.error ?? "FORBIDDEN", "Forbidden");
    return;
  }
  res.status(200).json({ success: true, data: result });
};
