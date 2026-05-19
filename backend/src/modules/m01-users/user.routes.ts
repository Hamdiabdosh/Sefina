import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/role";
import { validateBody } from "../../middleware/validate";
import { resendInviteHandler, setUserPasswordHandler } from "./user.controller";
import { setUserPasswordSchema } from "./user.schema";

const userRoutes = Router();

userRoutes.use(requireAuth, requireRole(["super_admin"]));

userRoutes.post("/:id/resend-invite", resendInviteHandler);
userRoutes.patch(
  "/:id/set-password",
  validateBody(setUserPasswordSchema),
  setUserPasswordHandler
);

export default userRoutes;
