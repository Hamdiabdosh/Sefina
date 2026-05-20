# Sefinet Al Neja Changelog

All notable changes to **Sefinet Al Neja** (Harari Medresa Management System) will be documented in this file.

## [Unreleased]

### Added

- **M10: Reporting & Dashboard** — `backend/src/modules/m10-reports/`, `frontend/src/features/reports/`.
  - **Dashboards:** `GET /api/v1/dashboard/teacher|medresa|super-admin` with KPIs and chart data.
  - **Reports (R01–R05):** JSON preview endpoints under `/api/v1/reports/*`; client PDF/Excel export.
  - **UI:** `/teacher/dashboard`, `/medresa/dashboard`, `/admin/dashboard`, role-scoped `/…/reports`.
  - **Docs:** `docs/10-reporting.md`, `docs/m10-reports-api-tests.md`.
  - **Verify:** `./scripts/verify-m10-reports-api.sh` or `make dev-verify-m10`.
- **M09: Salary Management** — `backend/src/modules/m09-salaries/`, `frontend/src/features/salaries/`.
  - **Super Admin only:** salary ranks (versioned amounts), teacher rank assignment, monthly payments (bank reference required), payment list (PAID/UNPAID), teacher history, network overview.
  - **Cron:** monthly unpaid-teacher log (1st of month, 06:00 Addis Ababa).
  - **UI:** `/admin/salaries`, `/admin/salary-ranks`, record payment, teacher salary history; nav **Salary** for Super Admin only.
  - **Docs:** `docs/09-salary.md`, `docs/m09-salaries-api-tests.md`.
  - **Verify:** `./scripts/verify-m09-salaries-api.sh` or `make dev-verify-m09`.
- **M08 finalized** — Epic E8 complete on task board. Deferred: fee PDF export, dashboard KPI widgets, payment void UI (API exists). Full cross-module API regression deferred.
- **M08: Fee Management** — `backend/src/modules/m08-fees/`, `frontend/src/features/fees/`.
  - **Fee structure (Super Admin):** versioned network monthly fee (`POST/GET /api/v1/fee-structures`).
  - **Collection (Amir):** `GET /medresas/:id/fees/collection`, `POST /fee-payments`, student history, medresa/network overviews.
  - **Rules:** Ethiopian month/year billing, partial payments, carryover balances, teachers blocked (403), Amir cross-medresa denied.
  - **UI:** `/admin/fee-structure`, `/admin/fees`, `/medresa/fees`, record payment, student fee history; student detail `feeStatus`.
  - **Docs:** `docs/08-fees.md`, `docs/m08-fees-api-tests.md`.
  - **Verify:** `./scripts/verify-m08-fees-api.sh` or `make dev-verify-m08`.
- **M07 finalized** — core + gap closure complete; Epic E7 done on task board. Deferred to M10: results PDF, teacher dashboard grade widgets, approve/reject notifications, academic year/term on grades.
- **M07 gap closure** — teacher grade edit request UI (S35), student results page with filters (S37), exam type edit (trilingual), medresa/network results tables with teacher column and `useMedresaContext`, class results exam-type filter, expanded `verify-m07-grades-api.sh` (400/403/422), `gradesSummary` on student detail, docs/locale cleanup (`comingM07` removed).
- **M07: Grades & Results** — `backend/src/modules/m07-grades/`, `frontend/src/features/grades/`.
  - **Exam types (Super Admin):** `GET/POST/PATCH /api/v1/exam-types`; active weights must sum to 100%.
  - **Grade entry (Teacher):** `POST /api/v1/grades`, `POST /api/v1/grades/batch`, roster helper; letter grades auto-calculated.
  - **Edit approval:** `POST /api/v1/grades/:gradeId/edit-requests`, `GET/PATCH /api/v1/grade-edit-requests`.
  - **Results:** student, course, medresa overview, network overview read APIs.
  - **UI:** `/admin/exam-types`, `/teacher/grades`, grade entry, edit approval, results overviews; nav + i18n.
  - **Docs:** `docs/07-grades.md`, `docs/m07-grades-api-tests.md`.
  - **Verify:** `./scripts/verify-m07-grades-api.sh` or `make dev-verify-m07`.
- **Frontend: unified app shell** — dark sidebar with sectioned nav, mobile drawer, calm `PageTopBar` / `PageBody` replacing the teal hero header; shared `StatCard`, `FilterTabs`, and `ContentCard`; Super Admin sidebar counts for medresas/teachers. See `docs/ui-conventions.md`.
- **Frontend: list-page redesigns** — Teachers (grid/list toggle, KPI strip, `TeacherListCard`), Medresas, Students, Courses, dashboards, and attendance screens migrated to the new shell; extended i18n (`en` / `am` / `ar`).
- **Dev seed dataset** — `npm run db:seed:dev` seeds 5 medresas, 10 teachers (5 medresa admins + 5 ustaz), 3 master courses, 100 students (20 per medresa) with course enrollments; idempotent. Wired into `make dev-up` / `setup-dev.sh`. Verify: `./scripts/verify-seed-dev.sh` or `make dev-verify-seed`. Credentials: `docs/seed-dev-credentials.md`.
- **M06: Attendance tracking** — `backend/src/modules/m06-attendance/`, Ethiopia (`Africa/Addis_Ababa`) calendar semantics, cron + stale lock bootstrap.
  - **Model:** one roll per **medresa per day** (`AttendanceSession.medresa_id`); roster = all active students at that medresa; `teacher_marked_at` / `admin_marked_at` audit who last saved.
  - **Writers:** `requireAttendanceWriter` — TEACHER or Amir (ADMIN) at the medresa; Super Admin read-only on writes.
  - **API:** `GET /attendance/roster`, `POST/PATCH /attendance/sessions`, `GET /sessions` + `/sessions/today-session`, `GET /attendance/students/:id`; Amir `GET /medresas/:medresaId/attendance/overview`; Super Admin `GET /attendance/network-overview`.
  - **UI:** shared `DailyAttendanceTakePage` at `/teacher/attendance/take` and `/medresa/attendance/take` (`?medresaId=`); hubs at `/teacher/attendance`, `/medresa/attendance`, `/admin/attendance`; shell **Attendance** nav entry.
  - **Docs:** `docs/06-attendance.md`, `docs/m06-attendance-api-tests.md`.
  - **Verify:** `./scripts/verify-m06-attendance-api.sh` or `make dev-verify-m06`.
- **M05: Student Management** — student module in `backend/src/modules/m05-student/` and `frontend/src/features/students/`.
  - **Per-medresa (Medresa Admin):** enroll, edit, list (search/status/course filters), assign/remove course, transfer between medresas; optional photo upload.
  - **Course rules:** assignment only to active medresa courses with an assigned teacher; soft-delete enrollments.
  - **Teacher roster:** read-only list and detail for students in assigned courses.
  - **APIs:** `/api/v1/medresas/:medresaId/students`, `/api/v1/students/*`, `/api/v1/teacher/students`.
  - **UI routes:** `/medresa/students`, `/medresa/students/$studentId`, `/teacher/students`; **Students** nav for Medresa Admin, Teacher, and Super Admin.
  - **Docs:** `docs/05-student.md`, `docs/m05-student-api-tests.md`.
  - **M05 close-out:** `./scripts/verify-m05-student-api.sh` (or `make dev-verify-m05`) automates the student API checklist against the dev seed; four logins (avoids common auth rate-limit hit from Super Admin `/medresas` probing).
- **M04: Course Management** — full course module in `backend/src/modules/m04-course/` and `frontend/src/features/courses/`.
  - **Master catalog (Super Admin):** create, edit, deactivate, and reactivate network-wide courses with trilingual `name`/`description` JSON (`en` required), `BEGINNER`/`INTERMEDIATE`/`ADVANCED` levels, and network-unique English names; list includes medresa activation count.
  - **Per-medresa (Medresa Admin):** activate courses from the master list, deactivate within own medresa only, assign one teacher per course (teacher must already be on the medresa via M03), list with assigned teacher and student count.
  - **Course detail (S19):** Medresa Admin and assigned Teacher; **attendance** wired to M06 modules; grades section reserved for M07.
  - **APIs:** `/api/v1/courses` and `/api/v1/medresas/:medresaId/courses` (plus `/available` and `/teachers` helpers for activation and assignment UI).
  - **UI routes:** `/admin/courses`, `/medresa/courses`, `/medresa/courses/$medresaCourseId`; **Courses** added to Super Admin and Medresa Admin nav; medresa picker when user is admin of multiple medresas.
  - **Docs:** `docs/04-course.md`, manual test matrix in `docs/m04-course-api-tests.md`.
- **M03: Teacher Management** — teacher CRUD with auto-linked users, medresa assignments (single + bulk), photo upload, `/teachers/me`, Super Admin UI at `/admin/teachers`.
- Teacher create: optional initial medresa assignment, temporary password / invite email options; Amir i18n labels for `ADMIN` role (en/am/ar).
- Teacher detail: resend invite and set temporary password (via retained user account endpoints).
- **M02 close-out:** PATCH deactivate/reactivate medresa endpoints; Medresa detail page (S09); status-only deactivation (inactive medresas remain visible to Super Admin).
- `backend/src/lib/medresa-scope.ts` — reusable active-medresa query helper for M03+.
- `make dev-up` / `./scripts/setup-dev.sh` — one-command dev stack: compose up, migrate, seed, login smoke test.
- `make dev-verify` / `./scripts/verify-dev.sh` — health + login check for a running stack.
- `make dev-reset-db` — wipe Postgres volume and re-run full setup.
- Backend container healthcheck in `docker-compose.yml`.

### Changed
- **M06 attendance** — redesigned from per-course sessions (`medresa_course_id`) to per-medresa daily rolls; Amir can create and patch same-day attendance alongside teachers; `teacher_id` optional on session; student history open to any viewer with student read access (not teacher-only).
- **M04 medresa courses list** — teachers calling `GET /medresas/:medresaId/courses` are scoped to their own assignments automatically; Amir retains full medresa list.
- **Super Admin** medresa picker: `useMedresaContext()` loads active medresas from `GET /api/v1/medresas` (only when `isSuperAdmin`) so Students and Medresa courses pages resolve `medresaId` and `?medresaId=` even when the JWT has no medresa roles. App shell adds separate **Course catalog** and **Medresa courses** nav entries.
- Course detail links to student list filtered by course (`courses.viewStudents`).
- App shell navigation labels moved to i18n keys (`nav.medresas`, `nav.teachers`, `nav.courses`, etc.).
- Staff onboarding consolidated under **Teachers** only; removed `/admin/users` screen and `GET`/`POST /api/v1/users`.
- Auth `medresaRoles` now exclude assignments to inactive medresas (login/refresh/`/me`).
- Medresa API: removed `DELETE /:id`; use `PATCH /:id/deactivate` and `PATCH /:id/reactivate` instead.
- `.env.example` dev passwords aligned with `docker-compose.yml`, `sql/init.sql`, and PgBouncer userlist.
- Rebranded application from **HMMS** to **Sefinet Al Neja** across UI, emails, package names, Docker identifiers, and core documentation.
- Restored `Sefinet-Agent-Rules.md` (rebuilt from project specs; Local History had no snapshot).
- Docker dev backend: **`/app/node_modules` uses a named volume** (`sefinet-backend-node-modules`) so `make dev-backend-deps` (`docker compose run … npm ci`) updates the same tree the running container uses; avoids crash loops when `package-lock.json` gains packages (e.g. M06 `date-fns-tz`).
- Renamed docs to `Sefinet-*` / `sefinet_*` with redirect stubs for legacy `HMMS-*` / `hmms_*` paths.

### Removed
- **`PageHeader`** — teal hero header; use `PageTopBar` + `PageBody` instead.
- **`TeacherCourseAttendancePage`** — per-course take route `/teacher/attendance/$medresaCourseId`; replaced by medresa daily take flow.

## [1.0.0] - 2026-05-10

### Added
- **Platform Foundation (Phase 0):**
  - Tailwind CSS 4 configuration with custom "Modern Islamic" theme (Teal/Cream palette).
  - Centralized Axios client with automatic JWT injection and silent token refresh logic.
  - Reusable `GeometricPattern` and `PageHeader` components following UI/UX specifications.
  - TanStack Router integration with guarded route support.
  - TanStack Query setup for efficient server state management.

- **M01: User & Role Management:**
  - High-fidelity **Login Screen** (S01) with mobile-first design.
  - **Forgot Password** (S02) and **Reset Password** (S03) screens with validation.
  - `useAuth` hook for managing global authentication state.
  - Full Backend implementation of JWT issuance, token rotation, and password reset workflows.

- **M02: Medresa Management:**
  - Integrated Medresa CRUD endpoints into the main backend server.
  - **Medresa List** (S07) with search, status filtering, and network-wide stats.
  - Medresa cards featuring student/teacher counts and location data.
  - Backend validation for medresa creation and updates using Zod.

### Fixed
- Broken import path in `useMedresas` hook.
- Mounted missing `medresaRoutes` in backend `server.ts`.
- Resolved infinite recursion in `App.tsx` by correcting `rootRoute` component structure.

### Security
- Implemented `requireAuth` and `requireSuperAdmin` middleware on critical endpoints.
- Configured secure, rotated Refresh Tokens stored in the database.
- Added helmet security headers and CORS whitelisting to the backend.
