import type { Request, Response } from "express";
import { MedresaRole } from "../../../prisma/generated/prisma/enums";
import { assignTeacherToCourse } from "./course-assignment.service";
import type {
  ActivateMedresaCourseInput,
  AssignTeacherToCourseInput,
  CreateCourseInput,
  ListCoursesQuery,
  ListMedresaCoursesQuery,
  UpdateCourseInput,
} from "./course.schema";
import {
  createCourse,
  deactivateCourse,
  getCourseById,
  listCourses,
  reactivateCourse,
  updateCourse,
} from "./course.service";
import { getTeacherByUserId } from "../m03-teacher/teacher.service";
import {
  activateCourseInMedresa,
  deactivateMedresaCourse,
  getMedresaCourseDetail,
  listAvailableMasterCourses,
  listMedresaCourses,
  listTeachersForMedresaAssignment,
} from "./medresa-course.service";

const getIdParam = (req: Request): string => String(req.params.id);
const getMedresaIdParam = (req: Request): string => String(req.params.medresaId);
const getMedresaCourseIdParam = (req: Request): string => String(req.params.medresaCourseId);

const hasMedresaAdminRole = (req: Request, medresaId: string): boolean =>
  req.user!.isSuperAdmin ||
  (req.user!.medresaRoles ?? []).some(
    (r) => r.medresaId === medresaId && r.role === MedresaRole.ADMIN
  );

export const listCoursesHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await listCourses(req.validatedQuery as ListCoursesQuery);
  res.status(200).json({ success: true, data: result });
};

export const getCourseHandler = async (req: Request, res: Response): Promise<void> => {
  const course = await getCourseById(getIdParam(req));
  if (!course) {
    res.status(404).json({
      success: false,
      error: { code: "COURSE_NOT_FOUND", message: "Course not found" },
    });
    return;
  }
  res.status(200).json({ success: true, data: course });
};

export const createCourseHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await createCourse(req.body as CreateCourseInput, req.user!.userId);
  if ("error" in result) {
    res.status(409).json({
      success: false,
      error: { code: result.error, message: "Course name already exists" },
    });
    return;
  }
  res.status(201).json({ success: true, data: result.course });
};

export const updateCourseHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await updateCourse(
    getIdParam(req),
    req.body as UpdateCourseInput,
    req.user!.userId
  );
  if ("error" in result) {
    const status = result.error === "DUPLICATE_COURSE_NAME" ? 409 : 404;
    res.status(status).json({
      success: false,
      error: {
        code: result.error,
        message:
          result.error === "DUPLICATE_COURSE_NAME"
            ? "Course name already exists"
            : "Course not found",
      },
    });
    return;
  }
  res.status(200).json({ success: true, data: result.course });
};

export const deactivateCourseHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await deactivateCourse(getIdParam(req), req.user!.userId);
  if ("error" in result) {
    res.status(404).json({
      success: false,
      error: { code: result.error, message: "Course not found" },
    });
    return;
  }
  res.status(200).json({ success: true, data: result.course });
};

export const reactivateCourseHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await reactivateCourse(getIdParam(req), req.user!.userId);
  if ("error" in result) {
    res.status(404).json({
      success: false,
      error: { code: result.error, message: "Course not found" },
    });
    return;
  }
  res.status(200).json({ success: true, data: result.course });
};

export const listAvailableMasterCoursesHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await listAvailableMasterCourses(getMedresaIdParam(req));
  if ("error" in result) {
    res.status(400).json({
      success: false,
      error: { code: result.error, message: "Medresa is not active" },
    });
    return;
  }
  res.status(200).json({ success: true, data: result });
};

export const listMedresaTeachersHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await listTeachersForMedresaAssignment(getMedresaIdParam(req));
  if ("error" in result) {
    res.status(400).json({
      success: false,
      error: { code: result.error, message: "Medresa is not active" },
    });
    return;
  }
  res.status(200).json({ success: true, data: result });
};

export const listMedresaCoursesHandler = async (req: Request, res: Response): Promise<void> => {
  const medresaId = getMedresaIdParam(req);
  let query: ListMedresaCoursesQuery = {
    ...(req.validatedQuery as ListMedresaCoursesQuery),
  };

  if (!hasMedresaAdminRole(req, medresaId)) {
    const teacher = await getTeacherByUserId(req.user!.userId);
    if (!teacher) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Teacher profile required" },
      });
      return;
    }
    if (query.teacherId && query.teacherId !== teacher.id) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Cannot list courses for another teacher" },
      });
      return;
    }
    query = { ...query, teacherId: teacher.id };
  }

  const result = await listMedresaCourses(medresaId, query);
  if ("error" in result) {
    res.status(400).json({
      success: false,
      error: { code: result.error, message: "Medresa is not active" },
    });
    return;
  }
  res.status(200).json({ success: true, data: result });
};

export const activateMedresaCourseHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await activateCourseInMedresa(
    getMedresaIdParam(req),
    req.body as ActivateMedresaCourseInput,
    req.user!.userId
  );
  if ("error" in result) {
    const status =
      result.error === "COURSE_NOT_FOUND"
        ? 404
        : result.error === "MEDRESA_INACTIVE"
          ? 400
          : 400;
    res.status(status).json({
      success: false,
      error: { code: result.error, message: result.error },
    });
    return;
  }
  res.status(201).json({ success: true, data: result.item });
};

export const deactivateMedresaCourseHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await deactivateMedresaCourse(
    getMedresaIdParam(req),
    getMedresaCourseIdParam(req),
    req.user!.userId
  );
  if ("error" in result) {
    res.status(404).json({
      success: false,
      error: { code: result.error, message: "Medresa course not found" },
    });
    return;
  }
  res.status(200).json({ success: true, data: result.item });
};

export const assignTeacherToCourseHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await assignTeacherToCourse(
    getMedresaIdParam(req),
    getMedresaCourseIdParam(req),
    req.body as AssignTeacherToCourseInput,
    req.user!.userId
  );
  if ("error" in result) {
    const status =
      result.error === "MEDRESA_COURSE_NOT_FOUND"
        ? 404
        : result.error === "TEACHER_NOT_IN_MEDRESA"
          ? 400
          : 400;
    res.status(status).json({
      success: false,
      error: {
        code: result.error,
        message:
          result.error === "TEACHER_NOT_IN_MEDRESA"
            ? "Teacher must be assigned to this medresa first"
            : result.error,
      },
    });
    return;
  }
  res.status(201).json({ success: true, data: result.assignment });
};

export const getMedresaCourseDetailHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const medresaId = getMedresaIdParam(req);
  const result = await getMedresaCourseDetail(medresaId, getMedresaCourseIdParam(req), {
    userId: req.user!.userId,
    isSuperAdmin: req.user!.isSuperAdmin,
    isMedresaAdmin: hasMedresaAdminRole(req, medresaId),
  });

  if ("error" in result) {
    const status = result.error === "FORBIDDEN" ? 403 : 404;
    res.status(status).json({
      success: false,
      error: { code: result.error, message: result.error },
    });
    return;
  }
  res.status(200).json({ success: true, data: result.item });
};
