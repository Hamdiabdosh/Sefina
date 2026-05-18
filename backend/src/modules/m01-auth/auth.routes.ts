import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import {
  loginHandler,
  logoutHandler,
  meHandler,
  passwordResetConfirmHandler,
  passwordResetRequestHandler,
  refreshHandler,
} from "./auth.controller";
import {
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  refreshSchema,
} from "./auth.schema";

const authRoutes = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many auth attempts, try again later" },
  },
});

authRoutes.post("/login", authLimiter, validateBody(loginSchema), loginHandler);
authRoutes.post("/refresh", authLimiter, validateBody(refreshSchema), refreshHandler);
authRoutes.post("/logout", requireAuth, logoutHandler);
authRoutes.post(
  "/password-reset/request",
  authLimiter,
  validateBody(passwordResetRequestSchema),
  passwordResetRequestHandler
);
authRoutes.post(
  "/password-reset/confirm",
  authLimiter,
  validateBody(passwordResetConfirmSchema),
  passwordResetConfirmHandler
);
authRoutes.get("/me", requireAuth, meHandler);

export default authRoutes;
