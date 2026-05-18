import type { Request, Response } from "express";
import { Prisma } from "../../../prisma/generated/prisma/client";
import {
  createUser,
  deactivateUser,
  listUsers,
  reactivateUser,
  resendUserInvite,
  setUserTemporaryPassword,
  updateUser,
} from "./user.service";
import type { ListUsersQuery } from "./user.schema";

export const listUsersHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await listUsers(req.validatedQuery as ListUsersQuery);
  res.status(200).json({ success: true, data: result });
};

export const createUserHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await createUser(req.body, req.user!.userId);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({
        success: false,
        error: { code: "DUPLICATE_USER", message: "Email or phone already exists" },
      });
      return;
    }
    throw error;
  }
};

export const updateUserHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await updateUser(req.params.id as string, req.body, req.user!.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "User not found" },
      });
      return;
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({
        success: false,
        error: { code: "DUPLICATE_USER", message: "Email or phone already exists" },
      });
      return;
    }
    throw error;
  }
};

export const deactivateUserHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await deactivateUser(req.params.id as string, req.user!.userId);

  if (result && "error" in result) {
    if (result.error === "SUPER_ADMIN") {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Super Admin account cannot be deactivated" },
      });
      return;
    }
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "User not found" },
    });
    return;
  }

  res.status(200).json({ success: true, data: result.user });
};

export const reactivateUserHandler = async (req: Request, res: Response): Promise<void> => {
  const user = await reactivateUser(req.params.id as string, req.user!.userId);
  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "User not found" },
    });
    return;
  }
  res.status(200).json({ success: true, data: user });
};

export const setUserPasswordHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await setUserTemporaryPassword(
    req.params.id as string,
    req.body.temporaryPassword,
    req.user!.userId
  );
  if (!result) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "User not found" },
    });
    return;
  }
  res.status(200).json({
    success: true,
    data: { message: "Temporary password set", email: result.email },
  });
};

export const resendInviteHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await resendUserInvite(req.params.id as string, req.user!.userId);
  if (!result) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "User not found or cannot receive invite" },
    });
    return;
  }
  res.status(200).json({
    success: true,
    data: { message: "Invite email sent", email: result.email },
  });
};
