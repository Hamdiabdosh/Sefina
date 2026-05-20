import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { env } from "../config/env";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png"]);
const MAX_BYTES = 2 * 1024 * 1024;

export const validateStudentPhoto = (file: Express.Multer.File): string | null => {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return "Photo must be JPEG or PNG";
  }
  if (file.size > MAX_BYTES) {
    return "Photo must be 2MB or smaller";
  }
  return null;
};

const extensionForMime = (mime: string): string => (mime === "image/png" ? "png" : "jpg");

export const saveStudentPhoto = async (file: Express.Multer.File): Promise<string> => {
  const ext = extensionForMime(file.mimetype);
  const filename = `${crypto.randomUUID()}.${ext}`;
  const relativePath = path.join("students", filename);
  const absoluteDir = path.join(env.UPLOAD_DIR, "students");
  const absolutePath = path.join(env.UPLOAD_DIR, relativePath);

  await fs.mkdir(absoluteDir, { recursive: true });
  await fs.writeFile(absolutePath, file.buffer);

  return relativePath.replace(/\\/g, "/");
};

export const deleteStudentPhotoFile = async (photoUrl: string | null): Promise<void> => {
  if (!photoUrl) return;
  const absolutePath = path.join(env.UPLOAD_DIR, photoUrl);
  try {
    await fs.unlink(absolutePath);
  } catch {
    // ignore missing files
  }
};

export const resolveStudentPhotoPath = (photoUrl: string): string =>
  path.join(env.UPLOAD_DIR, photoUrl);
