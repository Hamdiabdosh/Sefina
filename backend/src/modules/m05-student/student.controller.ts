import type { Request, Response } from "express";
import { resolveStudentPhotoPath, validateStudentPhoto } from "../../lib/student-photo";
import {
  assertStudentPhotoAccess,
  assignStudentToCourse,
  createStudent,
  getStudentDetail,
  listStudentsByMedresa,
  listTeacherStudents,
  listTransferDestinations,
  removeStudentFromCourse,
  transferStudent,
  updateStudent,
} from "./student.service";
import {
  createStudentSchema,
  type AssignStudentCourseInput,
  type CreateStudentInput,
  type ListStudentsQuery,
  type TransferStudentInput,
  type UpdateStudentInput,
} from "./student.schema";

const getIdParam = (req: Request): string => String(req.params.id);
const getMedresaIdParam = (req: Request): string => String(req.params.medresaId);
const getStudentCourseIdParam = (req: Request): string => String(req.params.studentCourseId);

const parseStudentBody = (req: Request): CreateStudentInput => ({
  fullName: req.body.fullName,
  dateOfBirth: req.body.dateOfBirth,
  gender: req.body.gender,
  address: req.body.address,
  guardianName: req.body.guardianName,
  guardianPhone: req.body.guardianPhone,
});

export const listMedresaStudentsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await listStudentsByMedresa(
    getMedresaIdParam(req),
    req.validatedQuery as ListStudentsQuery
  );

  if ("error" in result) {
    res.status(422).json({
      success: false,
      error: { code: result.error, message: "Medresa is not active" },
    });
    return;
  }

  res.status(200).json({ success: true, data: result });
};

export const createStudentHandler = async (req: Request, res: Response): Promise<void> => {
  const file = req.file;
  if (file) {
    const photoError = validateStudentPhoto(file);
    if (photoError) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_PHOTO", message: photoError },
      });
      return;
    }
  }

  const parsed = createStudentSchema.safeParse(parseStudentBody(req));
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      },
    });
    return;
  }

  const result = await createStudent(
    getMedresaIdParam(req),
    parsed.data,
    req.user!.userId,
    file
  );

  if ("error" in result) {
    res.status(422).json({
      success: false,
      error: { code: result.error, message: "Medresa is not active" },
    });
    return;
  }

  res.status(201).json({ success: true, data: result.student });
};

export const getStudentHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await getStudentDetail(req, getIdParam(req));

  if ("error" in result) {
    const status = result.error === "FORBIDDEN" ? 403 : 404;
    res.status(status).json({
      success: false,
      error: {
        code: result.error,
        message:
          result.error === "FORBIDDEN"
            ? "Insufficient permissions"
            : "Student not found",
      },
    });
    return;
  }

  res.status(200).json({ success: true, data: result.student });
};

export const updateStudentHandler = async (req: Request, res: Response): Promise<void> => {
  const file = req.file;
  if (file) {
    const photoError = validateStudentPhoto(file);
    if (photoError) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_PHOTO", message: photoError },
      });
      return;
    }
  }

  const result = await updateStudent(
    req,
    getIdParam(req),
    req.body as UpdateStudentInput,
    req.user!.userId,
    file
  );

  if ("error" in result) {
    const status =
      result.error === "FORBIDDEN" ? 403 : result.error === "STUDENT_NOT_FOUND" ? 404 : 400;
    res.status(status).json({
      success: false,
      error: {
        code: result.error,
        message:
          result.error === "FORBIDDEN"
            ? "Insufficient permissions"
            : "Student not found",
      },
    });
    return;
  }

  res.status(200).json({ success: true, data: result.student });
};

export const getStudentPhotoHandler = async (req: Request, res: Response): Promise<void> => {
  const access = await assertStudentPhotoAccess(req, getIdParam(req));
  if ("error" in access) {
    const status = access.error === "FORBIDDEN" ? 403 : 404;
    res.status(status).json({
      success: false,
      error: { code: access.error, message: "Photo not found" },
    });
    return;
  }

  const absolutePath = resolveStudentPhotoPath(access.photoUrl);
  res.sendFile(absolutePath, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Photo file missing" },
      });
    }
  });
};

export const uploadStudentPhotoHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const file = req.file;
  if (!file) {
    res.status(400).json({
      success: false,
      error: { code: "MISSING_FILE", message: "Photo file is required" },
    });
    return;
  }

  const photoError = validateStudentPhoto(file);
  if (photoError) {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_PHOTO", message: photoError },
    });
    return;
  }

  const result = await updateStudent(req, getIdParam(req), {}, req.user!.userId, file);

  if ("error" in result) {
    const status = result.error === "FORBIDDEN" ? 403 : 404;
    res.status(status).json({
      success: false,
      error: { code: result.error, message: "Cannot upload photo" },
    });
    return;
  }

  res.status(200).json({ success: true, data: result.student });
};

export const assignStudentCourseHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await assignStudentToCourse(
    req,
    getIdParam(req),
    req.body as AssignStudentCourseInput,
    req.user!.userId
  );

  if ("error" in result) {
    const code = result.error;
    const status =
      code === "FORBIDDEN"
        ? 403
        : code === "ALREADY_ENROLLED"
          ? 409
          : code === "STUDENT_NOT_FOUND" || code === "MEDRESA_COURSE_NOT_FOUND"
            ? 404
            : 400;
    res.status(status).json({
      success: false,
      error: {
        code,
        message: "Cannot assign student to course",
      },
    });
    return;
  }

  res.status(201).json({ success: true, data: result.enrollment });
};

export const removeStudentCourseHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await removeStudentFromCourse(
    req,
    getIdParam(req),
    getStudentCourseIdParam(req),
    req.user!.userId
  );

  if ("error" in result) {
    const status =
      result.error === "FORBIDDEN"
        ? 403
        : result.error === "ENROLLMENT_NOT_FOUND"
          ? 404
          : 404;
    res.status(status).json({
      success: false,
      error: { code: result.error, message: "Cannot remove enrollment" },
    });
    return;
  }

  res.status(200).json({ success: true, data: { removed: true } });
};

export const transferStudentHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await transferStudent(
    req,
    getIdParam(req),
    req.body as TransferStudentInput,
    req.user!.userId
  );

  if ("error" in result) {
    const code = result.error;
    const status =
      code === "FORBIDDEN"
        ? 403
        : code === "MEDRESA_INACTIVE"
          ? 422
          : code === "STUDENT_NOT_FOUND"
            ? 404
            : 400;
    res.status(status).json({
      success: false,
      error: { code, message: "Transfer failed" },
    });
    return;
  }

  res.status(200).json({ success: true, data: result.student });
};

export const listTeacherStudentsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await listTeacherStudents(req.user!.userId);
  res.status(200).json({ success: true, data: result });
};

export const listTransferDestinationsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const excludeMedresaId =
    typeof req.query.excludeMedresaId === "string" ? req.query.excludeMedresaId : undefined;
  const result = await listTransferDestinations(excludeMedresaId);
  res.status(200).json({ success: true, data: result });
};
