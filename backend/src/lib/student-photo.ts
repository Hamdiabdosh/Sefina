import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileTypeFromBuffer } from "file-type";
import { env } from "../config/env";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png"]);
const MAX_BYTES = 2 * 1024 * 1024;

export const validateStudentPhoto = async (
  file: Express.Multer.File
): Promise<string | null> => {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return "Photo must be JPEG or PNG";
  }
  if (file.size > MAX_BYTES) {
    return "Photo must be 2MB or smaller";
  }
  const detected = await fileTypeFromBuffer(file.buffer);
  if (!detected || !ALLOWED_MIME.has(detected.mime)) {
    return "Photo must be JPEG or PNG";
  }
  if (detected.mime !== file.mimetype) {
    return "Photo must be JPEG or PNG";
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
  try {
    const absolutePath = resolveStudentPhotoPath(photoUrl);
    await fs.unlink(absolutePath);
  } catch {
    // ignore invalid paths and missing files
  }
};

export const resolveStudentPhotoPath = (photoUrl: string): string => {
  const base = path.resolve(env.UPLOAD_DIR);
  const resolved = path.resolve(base, photoUrl);
  if (resolved !== base && !resolved.startsWith(`${base}${path.sep}`)) {
    throw new Error("Invalid photo path");
  }
  return resolved;
};
