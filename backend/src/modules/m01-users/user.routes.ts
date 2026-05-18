import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { validateBody } from "../../middleware/validate";
import { validateQuery } from "../../middleware/validate-query";
import {
  createUserHandler,
  deactivateUserHandler,
  listUsersHandler,
  reactivateUserHandler,
  resendInviteHandler,
  setUserPasswordHandler,
  updateUserHandler,
} from "./user.controller";
import {
  createUserSchema,
  listUsersQuerySchema,
  setUserPasswordSchema,
  updateUserSchema,
} from "./user.schema";

const userRoutes = Router();

userRoutes.use(requireAuth, requireRole(["super_admin"]));

userRoutes.get("/", validateQuery(listUsersQuerySchema), listUsersHandler);
userRoutes.post("/", validateBody(createUserSchema), createUserHandler);
userRoutes.post("/:id/resend-invite", resendInviteHandler);
userRoutes.patch(
  "/:id/set-password",
  validateBody(setUserPasswordSchema),
  setUserPasswordHandler
);
userRoutes.patch("/:id/deactivate", deactivateUserHandler);
userRoutes.patch("/:id/reactivate", reactivateUserHandler);
userRoutes.patch("/:id", validateBody(updateUserSchema), updateUserHandler);

export default userRoutes;
