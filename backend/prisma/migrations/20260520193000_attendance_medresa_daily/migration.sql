-- M06: Attendance sessions are scoped to (medresa, calendar date), not course.
-- This migration clears existing attendance rows (development-friendly) — re-seed dev data if needed.

DELETE FROM "AttendanceRecord";
DELETE FROM "AttendanceSession";

ALTER TABLE "AttendanceSession" DROP CONSTRAINT IF EXISTS "AttendanceSession_medresa_course_id_fkey";
ALTER TABLE "AttendanceSession" DROP CONSTRAINT IF EXISTS "AttendanceSession_teacher_id_fkey";

ALTER TABLE "AttendanceSession" DROP CONSTRAINT IF EXISTS "AttendanceSession_medresa_course_id_date_key";
DROP INDEX IF EXISTS "AttendanceSession_medresa_course_id_date_key";

ALTER TABLE "AttendanceSession" DROP COLUMN "medresa_course_id";

ALTER TABLE "AttendanceSession" ADD COLUMN "medresa_id" TEXT NOT NULL;

ALTER TABLE "AttendanceSession" ADD COLUMN "teacher_marked_at" TIMESTAMP(3),
ADD COLUMN "admin_marked_at" TIMESTAMP(3);

ALTER TABLE "AttendanceSession" ALTER COLUMN "teacher_id" DROP NOT NULL;

CREATE UNIQUE INDEX "AttendanceSession_medresa_id_date_key" ON "AttendanceSession"("medresa_id", "date");

CREATE INDEX "AttendanceSession_medresa_id_idx" ON "AttendanceSession"("medresa_id");

ALTER TABLE "AttendanceSession"
ADD CONSTRAINT "AttendanceSession_medresa_id_fkey"
FOREIGN KEY ("medresa_id") REFERENCES "Medresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AttendanceSession"
ADD CONSTRAINT "AttendanceSession_teacher_id_fkey"
FOREIGN KEY ("teacher_id") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
