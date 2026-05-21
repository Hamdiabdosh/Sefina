import type { Request, Response } from "express";
import { Prisma } from "../../../prisma/generated/prisma/client";
import {
  deleteTeacherPhotoFile,
  resolveTeacherPhotoPath,
  saveTeacherPhoto,
  validateTeacherPhoto,
} from "../../lib/teacher-photo";
import {
  assignTeacherToMedresa,
  bulkAssignTeacherToMedresas,
  removeTeacherFromMedresa,
  updateTeacherMedresaRole,
} from "./teacher-assignment.service";
import type { ListTeachersQuery } from "./teacher.schema";
import {
  createTeacher,
  deactivateTeacher,
  getTeacherById,
  getTeacherByUserId,
  listTeachers,
  reactivateTeacher,
  setTeacherPhoto,
  getTeacherPhotoPath,
  updateTeacher,
} from "./teacher.service";

const getIdParam = (req: Request): string => String(req.params.id);
const getMedresaIdParam = (req: Request): string => String(req.params.medresaId);

const handlePrismaConflict = (error: unknown, res: Response): boolean => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = String(error.meta?.target ?? "");
    const code = target.includes("phone")
      ? "TEACHER_PHONE_EXISTS"
      : target.includes("email")
        ? "TEACHER_EMAIL_EXISTS"
        : "TEACHER_DUPLICATE";
    res.status(409).json({
      success: false,
      error: { code, message: "Phone or email already exists" },
    });
    return true;
  }
  return false;
};

export const listTeachersHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await listTeachers(req.validatedQuery as ListTeachersQuery);
  res.status(200).json({ success: true, data: result });
};

export const getTeacherMeHandler = async (req: Request, res: Response): Promise<void> => {
  const teacher = await getTeacherByUserId(req.user!.userId);
  if (!teacher) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Teacher profile not found" },
    });
    return;
  }
  res.status(200).json({ success: true, data: teacher });
};

export const getTeacherHandler = async (req: Request, res: Response): Promise<void> => {
  const teacher = await getTeacherById(getIdParam(req));
  if (!teacher) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Teacher not found" },
    });
    return;
  }

  const isSelf = teacher.userId === req.user!.userId;
  if (!req.user!.isSuperAdmin && !isSelf) {
    res.status(403).json({
      success: false,
      error: { code: "FORBIDDEN", message: "Insufficient permissions" },
    });
    return;
  }

  res.status(200).json({ success: true, data: teacher });
};

export const createTeacherHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await createTeacher(req.body, req.user!.userId);
    if ("error" in result) {
      res.status(400).json({
        success: false,
        error: { code: result.error, message: "Medresa is inactive or not found" },
      });
      return;
    }
    res.status(201).json({ success: true, data: result.teacher });
  } catch (error) {
    if (handlePrismaConflict(error, res)) return;
    throw error;
  }
};

export const updateTeacherHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacher = await updateTeacher(getIdParam(req), req.body, req.user!.userId);
    if (!teacher) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Teacher not found" },
      });
      return;
    }
    res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    if (handlePrismaConflict(error, res)) return;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Teacher not found" },
      });
      return;
    }
    throw error;
  }
};

export const deactivateTeacherHandler = async (req: Request, res: Response): Promise<void> => {
  const teacher = await deactivateTeacher(getIdParam(req), req.user!.userId);
  if (!teacher) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Teacher not found" },
    });
    return;
  }
  res.status(200).json({ success: true, data: teacher });
};

export const reactivateTeacherHandler = async (req: Request, res: Response): Promise<void> => {
  const teacher = await reactivateTeacher(getIdParam(req), req.user!.userId);
  if (!teacher) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Teacher not found" },
    });
    return;
  }
  res.status(200).json({ success: true, data: teacher });
};

export const uploadTeacherPhotoHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const file = req.file;
  if (!file) {
    res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Photo file is required" },
    });
    return;
  }

  const validationError = await validateTeacherPhoto(file);
  if (validationError) {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_PHOTO", message: validationError },
    });
    return;
  }

  const photoPath = await saveTeacherPhoto(file);
  const teacher = await setTeacherPhoto(getIdParam(req), photoPath, req.user!.userId);

  if (!teacher) {
    await deleteTeacherPhotoFile(photoPath);
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Teacher not found" },
    });
    return;
  }

  res.status(200).json({ success: true, data: teacher });
};

export const getTeacherPhotoHandler = async (req: Request, res: Response): Promise<void> => {
  const record = await getTeacherPhotoPath(getIdParam(req));
  if (!record?.photo_url) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Photo not found" },
    });
    return;
  }

  const isSelf = record.user_id === req.user!.userId;
  if (!req.user!.isSuperAdmin && !isSelf) {
    res.status(403).json({
      success: false,
      error: { code: "FORBIDDEN", message: "Insufficient permissions" },
    });
    return;
  }

  let absolutePath: string;
  try {
    absolutePath = resolveTeacherPhotoPath(record.photo_url);
  } catch {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Photo not found" },
    });
    return;
  }
  res.sendFile(absolutePath, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Photo file missing" },
      });
    }
  });
};

export const assignMedresaHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await assignTeacherToMedresa(getIdParam(req), req.body, req.user!.userId);

  if (result && "error" in result) {
    if (result.error === "TEACHER_NOT_FOUND") {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Teacher not found or inactive" },
      });
      return;
    }
    if (result.error === "MEDRESA_INACTIVE") {
      res.status(422).json({
        success: false,
        error: { code: "MEDRESA_INACTIVE", message: "Medresa is not active" },
      });
      return;
    }
  }

  res.status(200).json({ success: true, data: result });
};

export const bulkAssignMedresaHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await bulkAssignTeacherToMedresas(
    getIdParam(req),
    req.body,
    req.user!.userId
  );

  if (result && "error" in result) {
    if (result.error === "TEACHER_NOT_FOUND") {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Teacher not found or inactive" },
      });
      return;
    }
    if (result.error === "MEDRESA_INACTIVE") {
      res.status(422).json({
        success: false,
        error: {
          code: "MEDRESA_INACTIVE",
          message: `Medresa ${result.medresaId} is not active`,
        },
      });
      return;
    }
  }

  res.status(200).json({ success: true, data: result });
};

export const updateAssignmentRoleHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await updateTeacherMedresaRole(
    getIdParam(req),
    getMedresaIdParam(req),
    req.body,
    req.user!.userId
  );

  if (result && "error" in result) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Assignment not found" },
    });
    return;
  }

  res.status(200).json({ success: true, data: result });
};

export const removeFromMedresaHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await removeTeacherFromMedresa(
    getIdParam(req),
    getMedresaIdParam(req),
    req.user!.userId
  );

  if (result && "error" in result) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Assignment not found" },
    });
    return;
  }

  res.status(200).json({ success: true, data: result });
};
