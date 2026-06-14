-- Student hardening: lifecycle statuses, profile fields, notes, enrollment periods

-- StudentStatus enum values
ALTER TYPE "StudentStatus" ADD VALUE IF NOT EXISTS 'WITHDRAWN';
ALTER TYPE "StudentStatus" ADD VALUE IF NOT EXISTS 'GRADUATED';

-- EnrollmentEndReason enum
DO $$ BEGIN
  CREATE TYPE "EnrollmentEndReason" AS ENUM (
    'ENROLLED',
    'TRANSFERRED',
    'WITHDRAWN',
    'GRADUATED',
    'REACTIVATED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Student columns
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "secondary_guardian_name" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "secondary_guardian_phone" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "national_id" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "blood_group" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "allergies" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "enrollment_number" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "withdrawn_at" TIMESTAMP(3);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "graduated_at" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Student_current_medresa_id_enrollment_number_key"
  ON "Student"("current_medresa_id", "enrollment_number");

CREATE INDEX IF NOT EXISTS "idx_student_medresa_status_active"
  ON "Student"("current_medresa_id", "status")
  WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "idx_student_guardian_phone"
  ON "Student"("guardian_phone")
  WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_student_unique_identity"
  ON "Student"("current_medresa_id", lower("full_name"), "date_of_birth")
  WHERE "deleted_at" IS NULL;

-- StudentNote
CREATE TABLE IF NOT EXISTS "StudentNote" (
  "id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "medresa_id" TEXT NOT NULL,
  "author_id" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "is_private" BOOLEAN NOT NULL DEFAULT true,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StudentNote_student_id_idx" ON "StudentNote"("student_id");
CREATE INDEX IF NOT EXISTS "StudentNote_medresa_id_idx" ON "StudentNote"("medresa_id");
CREATE INDEX IF NOT EXISTS "StudentNote_author_id_idx" ON "StudentNote"("author_id");

DO $$ BEGIN
  ALTER TABLE "StudentNote" ADD CONSTRAINT "StudentNote_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "StudentNote" ADD CONSTRAINT "StudentNote_medresa_id_fkey"
    FOREIGN KEY ("medresa_id") REFERENCES "Medresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "StudentNote" ADD CONSTRAINT "StudentNote_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- StudentEnrollmentPeriod
CREATE TABLE IF NOT EXISTS "StudentEnrollmentPeriod" (
  "id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "medresa_id" TEXT NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL,
  "ended_at" TIMESTAMP(3),
  "end_reason" "EnrollmentEndReason" NOT NULL DEFAULT 'ENROLLED',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentEnrollmentPeriod_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StudentEnrollmentPeriod_student_id_idx" ON "StudentEnrollmentPeriod"("student_id");
CREATE INDEX IF NOT EXISTS "StudentEnrollmentPeriod_medresa_id_idx" ON "StudentEnrollmentPeriod"("medresa_id");
CREATE INDEX IF NOT EXISTS "StudentEnrollmentPeriod_started_at_idx" ON "StudentEnrollmentPeriod"("started_at");

DO $$ BEGIN
  ALTER TABLE "StudentEnrollmentPeriod" ADD CONSTRAINT "StudentEnrollmentPeriod_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "StudentEnrollmentPeriod" ADD CONSTRAINT "StudentEnrollmentPeriod_medresa_id_fkey"
    FOREIGN KEY ("medresa_id") REFERENCES "Medresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
