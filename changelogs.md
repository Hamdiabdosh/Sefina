# Sefinet Al Neja Changelog

All notable changes to **Sefinet Al Neja** (Harari Medresa Management System) will be documented in this file.

## [Unreleased]

### Added
- **M04: Course Management** — master course catalog (Super Admin), per-medresa activation, teacher-to-course assignment, course detail; APIs at `/api/v1/courses` and `/api/v1/medresas/:medresaId/courses`; UI at `/admin/courses` and `/medresa/courses`.
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
- Staff onboarding consolidated under **Teachers** only; removed `/admin/users` screen and `GET`/`POST /api/v1/users`.
- Auth `medresaRoles` now exclude assignments to inactive medresas (login/refresh/`/me`).
- Medresa API: removed `DELETE /:id`; use `PATCH /:id/deactivate` and `PATCH /:id/reactivate` instead.
- `.env.example` dev passwords aligned with `docker-compose.yml`, `sql/init.sql`, and PgBouncer userlist.
- Rebranded application from **HMMS** to **Sefinet Al Neja** across UI, emails, package names, Docker identifiers, and core documentation.
- Restored `Sefinet-Agent-Rules.md` (rebuilt from project specs; Local History had no snapshot).
- Renamed docs to `Sefinet-*` / `sefinet_*` with redirect stubs for legacy `HMMS-*` / `hmms_*` paths.

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
