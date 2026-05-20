import dotenv from "dotenv";
import path from "path";
import { defineConfig, env } from "prisma/config";

// Match src/config/env.ts: allow DATABASE_URL in repo-root .env when cwd is backend/
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
