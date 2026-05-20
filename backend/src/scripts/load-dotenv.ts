/**
 * Load .env for CLI scripts run from backend/ (cwd).
 * Repo-root .env is the standard location (see README cp .env.example .env).
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
