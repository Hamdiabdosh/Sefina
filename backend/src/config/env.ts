import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const emptyToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 chars"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().min(1).default("Sefinet Al Neja <noreply@sefinet.et>"),
  RESET_TOKEN_EXPIRY_HOURS: z.coerce.number().int().positive().default(1),
  GOOGLE_CLIENT_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  GOOGLE_CLIENT_SECRET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  GOOGLE_REDIRECT_URI: z.preprocess(
    emptyToUndefined,
    z.string().url().optional()
  ),
  UPLOAD_DIR: z.string().min(1).default("uploads"),
});

const parsed = envSchema.parse(process.env);

const DEV_JWT_SECRETS = new Set([
  "dev-access-secret-change-in-production",
  "dev-refresh-secret-change-in-production",
]);

if (parsed.NODE_ENV === "production") {
  const unsafe = [parsed.JWT_ACCESS_SECRET, parsed.JWT_REFRESH_SECRET].filter((secret) =>
    DEV_JWT_SECRETS.has(secret)
  );
  if (unsafe.length > 0) {
    console.error(
      "[env] FATAL: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must not use dev defaults in production"
    );
    process.exit(1);
  }
  const short = [parsed.JWT_ACCESS_SECRET, parsed.JWT_REFRESH_SECRET].filter(
    (secret) => secret.length < 32
  );
  if (short.length > 0) {
    console.error(
      "[env] FATAL: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be at least 32 characters in production"
    );
    process.exit(1);
  }
}

export const env = parsed;

export const isSmtpConfigured = (): boolean => Boolean(env.SMTP_HOST);

/** True when backend Google OAuth credentials are set (for token verify / redirect flow). */
export const isGoogleOAuthConfigured = (): boolean =>
  Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
