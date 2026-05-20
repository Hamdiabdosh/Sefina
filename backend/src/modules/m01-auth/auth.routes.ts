import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import {
  googleLoginHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  passwordResetConfirmHandler,
  passwordResetRequestHandler,
  refreshHandler,
} from "./auth.controller";
import {
  googleLoginSchema,
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  refreshSchema,
} from "./auth.schema";

const authRoutes = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many auth attempts, try again later" },
  },
});

/** Session refresh runs on every app load; keep a separate, higher cap than login brute-force limits. */
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  skipFailedRequests: true,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many auth attempts, try again later" },
  },
});

authRoutes.post("/login", authLimiter, validateBody(loginSchema), loginHandler);
authRoutes.post(
  "/google",
  authLimiter,
  validateBody(googleLoginSchema),
  googleLoginHandler
);
authRoutes.post("/refresh", refreshLimiter, validateBody(refreshSchema), refreshHandler);
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
