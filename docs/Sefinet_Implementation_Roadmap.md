# Sefinet Al Neja — Prioritized Implementation Roadmap

This roadmap turns `docs/features.md` and `docs/prompt.md` into an execution sequence for building **Sefinet Al Neja** safely, with strict module boundaries and dependency order.

> **Note:** Project rebranded from HMMS to **Sefinet Al Neja**.

## Delivery Principles

- Build in module order: `M01 -> M02 -> M03 -> M04 -> M05 -> M06/M07/M08/M09 -> M10`.
- Enforce data isolation from day 1 (`medresaId` scoping on all tenant data).
- Keep salary data Super Admin only (never exposed to Medresa Admin or Teacher flows).
- Keep Teacher as a network-level entity, with per-medresa role assignment.
- Ship each module only after API, UI, validation, and role guard checks pass.

## Phase 0 (Week 0): Platform Foundation

### Goals

- Prepare infrastructure and shared architecture before module development.

### Deliverables

- Backend scaffold (`Express + TypeScript + Prisma + PostgreSQL`).
- Frontend scaffold (`React + Vite + TypeScript + TanStack Router/Query`).
- Auth baseline with JWT issuing, refresh strategy (if used), and route guards.
- i18n setup with `en`, `am`, and `ar`, including RTL toggle for Arabic.
- Shared audit logging and error format conventions.

### Exit Criteria

- App boots locally with frontend/backend/database.
- Authenticated and unauthenticated route flows both work.
- Language switch works globally and RTL layout is functional.

## Phase 1 (Weeks 1-2): Tier 1 Foundation Modules

### Priority 1: M01 User & Role Management

- Build user identity, login, password reset, and base role framework.
- Add role checks for `Super Admin`, `Medresa Admin`, and `Teacher`.
- Keep medresa-scoped role mapping extensible for later modules.

**Exit criteria:** Login, token validation, role-protected endpoints, and audit log entries for auth events.

### Priority 2: M02 Medresa Management

- Super Admin can create, edit, deactivate medresas.
- Add medresa profile/settings records and status lifecycle.
- Prevent deactivated medresas from normal operational actions.

**Exit criteria:** Medresa CRUD works end-to-end and tenant-level visibility boundaries are enforced.

### Priority 3: M03 Teacher Management

- Create network-level teacher profiles (not medresa-owned).
- Assign teachers to medresas through join table.
- Support teacher role elevation to Medresa Admin per medresa.

**Exit criteria:** Same teacher can hold different roles in different medresas; assignment and unassignment are audited.

## Phase 2 (Weeks 3-4): Tier 2 Core Modules

### Priority 4: M04 Course Management

- Super Admin defines canonical course structures.
- Medresa Admin activates/assigns courses within their medresa context.
- Enforce assignment rules: only teachers already assigned to that medresa.

**Exit criteria:** Course activation and teacher assignment succeed only within valid medresa scope.

### Priority 5: M05 Student Management

- Medresa Admin creates and manages students in own medresa.
- Student-medresa association and student-course enrollment flow.
- Student profile includes placeholders for attendance/grades/fees integrations.

**Exit criteria:** Student enrollment lifecycle is complete and constrained to authorized medresa.

## Phase 3 (Weeks 5-7): Tier 3 Operational Modules

### Priority 6: M06 Attendance Tracking

- Teachers record attendance for assigned classes/students.
- Daily attendance status and corrections workflow with audit history.

**Exit criteria:** Attendance entries are role-scoped and tied to valid teacher-course-student relationships.

### Priority 7: M07 Grades & Results

- Teachers record assessments and grade entries.
- Support per-term/per-course grade summaries.

**Exit criteria:** Grade data can only be written by authorized teachers for assigned students/courses.

### Priority 8: M08 Fee Management

- Medresa Admin manages student fee tracking and payment records.
- Support fee due, partial/full payment, arrears status.
- Generate medresa-level fee reports and export-ready data.

**Exit criteria:** Fee data is isolated per medresa, and no Teacher or cross-medresa access exists.

### Priority 9: M09 Salary Management

- Super Admin only: salary scales, payroll records, payment history.
- Salary computation support by teacher and medresa context.
- Security hardening for salary endpoints and UI visibility.

**Exit criteria:** Salary module inaccessible to non-Super Admin roles at API and UI levels.

## Phase 4 (Week 8): Tier 4 Insights Module

### Priority 10: M10 Reporting & Dashboard

- Build role-scoped dashboards (Super Admin network-wide; Medresa Admin own medresa; Teacher own classes).
- Consume existing module tables only (no new core transactional tables).
- Add exports (PDF/Excel) for operational reporting.

**Exit criteria:** Each role sees only authorized metrics and reports render from live data across M01-M09.

## Cross-Cutting Workstreams (Run in Parallel)

### Security & Access Control

- Centralize authorization middleware and policy tests.
- Add explicit checks for every module endpoint by role + medresa scope.
- Log sensitive actions (role changes, salary updates, account changes).

### Quality & Testing

- Backend: unit tests for services + integration tests for role/scope rules.
- Frontend: component tests for forms and guarded routes.
- E2E: core flows per role (Super Admin, Medresa Admin, Teacher).

### Data & Migration Safety

- Versioned Prisma migrations per module.
- Seed scripts for demo medresas/teachers/students.
- Rollback strategy for high-risk migrations.

### Localization & UX

- Keep all user text translatable and key-driven.
- Verify RTL behavior on nav, tables, forms, and reports.
- Support low-bandwidth-friendly patterns where possible.

## Suggested Sprint Plan (10 Sprints)

- Sprint 1: Phase 0 + M01 start
- Sprint 2: M01 complete + M02
- Sprint 3: M03
- Sprint 4: M04
- Sprint 5: M05
- Sprint 6: M06
- Sprint 7: M07
- Sprint 8: M08
- Sprint 9: M09
- Sprint 10: M10 + stabilization/hardening

## Definition of Done per Module

- API endpoints implemented with Zod validation.
- Role and medresa-scope authorization enforced.
- UI screens and forms shipped with validation/error states.
- Audit logging added for critical write actions.
- Tests pass (unit/integration/e2e module slice).
- Documentation updated (`README` and module notes).

## Immediate Next Implementation Tasks

1. Finalize `M01` database schema and auth contract.
2. Implement role/scope middleware once and reuse in all modules.
3. Add a basic policy test matrix (`role x module x action`) before building `M02+`.
4. Define shared list/filter/pagination standards for all CRUD modules.
