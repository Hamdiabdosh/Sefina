import type { Request, Response } from "express";
import { Prisma } from "../../../prisma/generated/prisma/client";
import {
  createMedresa,
  deactivateMedresa,
  getMedresaDetail,
  getMedresas,
  getPublicMedresas,
  reactivateMedresa,
  updateMedresa,
} from "./medresa.service";

const getIdParam = (req: Request): string => String(req.params.id);

export const getMedresasHandler = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const medresas = await getMedresas();
    res.status(200).json({
      success: true,
      data: medresas,
    });
  } catch {
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch medresas",
      },
    });
  }
};

export const getMedresaDetailHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const medresa = await getMedresaDetail(getIdParam(req));

    if (!medresa) {
      res.status(404).json({
        success: false,
        error: {
          code: "MEDRESA_NOT_FOUND",
          message: "Medresa not found",
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: medresa,
    });
  } catch {
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch medresa details",
      },
    });
  }
};

export const createMedresaHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const medresa = await createMedresa(req.body);
    res.status(201).json({
      success: true,
      data: medresa,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({
        success: false,
        error: {
          code: "MEDRESA_NAME_EXISTS",
          message: "Medresa name already exists",
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create medresa",
      },
    });
  }
};

export const updateMedresaHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const medresa = await updateMedresa(getIdParam(req), req.body);

    if (!medresa) {
      res.status(404).json({
        success: false,
        error: {
          code: "MEDRESA_NOT_FOUND",
          message: "Medresa not found",
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: medresa,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({
        success: false,
        error: {
          code: "MEDRESA_NOT_FOUND",
          message: "Medresa not found",
        },
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({
        success: false,
        error: {
          code: "MEDRESA_NAME_EXISTS",
          message: "Medresa name already exists",
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update medresa",
      },
    });
  }
};

export const deactivateMedresaHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const medresa = await deactivateMedresa(getIdParam(req), req.user!.userId);

    if (!medresa) {
      res.status(404).json({
        success: false,
        error: {
          code: "MEDRESA_NOT_FOUND",
          message: "Medresa not found",
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: medresa,
    });
  } catch {
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to deactivate medresa",
      },
    });
  }
};

export const reactivateMedresaHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const medresa = await reactivateMedresa(getIdParam(req), req.user!.userId);

    if (!medresa) {
      res.status(404).json({
        success: false,
        error: {
          code: "MEDRESA_NOT_FOUND",
          message: "Medresa not found",
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: medresa,
    });
  } catch {
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to reactivate medresa",
      },
    });
  }
};

export const getPublicMedresasHandler = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const medresas = await getPublicMedresas();
    res.status(200).json({
      success: true,
      data: { items: medresas },
    });
  } catch {
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch medresas",
      },
    });
  }
};
