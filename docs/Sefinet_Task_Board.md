# Sefinet Al Neja — Execution Task Board

This board translates `docs/Sefinet_Implementation_Roadmap.md` into actionable epics and sprint-ready stories.

## Status Legend

- `[ ]` Not started
- `[-]` In progress
- `[x]` Done
- `[!]` Blocked

## Current focus

| Sprint | Module | Doc |
|--------|--------|-----|
| 8 (done) | M08 Fee Management | `docs/08-fees.md` |
| 9 (done) | M09 Salary Management | `docs/09-salary.md` |
| 10 (done) | M10 Reporting & Dashboard | `docs/10-reporting.md` |
| **11 (next)** | **Medresa Admin UX** | `docs/ux-backlog/Medresa-Admin-UX.md` |

Project-wide manual API regression (all modules) is scheduled later; use per-module `make dev-verify-m0N` scripts until then.

## Epic E0: Platform Foundation (Sprint 1)

### E0.1 Environment + Bootstrap

- [x] Backend app bootstrapped (`Express + TypeScript + Prisma`)
- [x] Frontend app bootstrapped (`React + Vite + TypeScript`)
- [x] Shared `.env.example` and env validation in backend
- [x] Local PostgreSQL + migration flow working
- [x] Health endpoints for backend + DB readiness

### E0.2 Shared Standards

- [x] Unified API error response shape
- [x] Request validation base (Zod middleware)
- [x] Audit log utility (actor/action/resource/time)
- [x] Pagination/filter/sort request conventions
- [x] API response envelope standard

### E0.3 i18n + RTL

- [x] i18n framework initialized in frontend (`en`, `am`, `ar`)
- [ ] Language switch persisted per user/session
- [x] RTL mode works for Arabic across app shell
- [x] Shared translation key structure agreed

### E0 DoD

- [x] Frontend + backend + DB start locally with one command set (`make dev-up`)
- [ ] CI runs lint/test skeleton for both apps
- [x] Architecture docs updated in `README`

---

## Epic E1: M01 User & Role Management (Sprints 1-2)

### E1.1 Authentication Core

- [x] User table + credentials model finalized
- [x] Login endpoint with JWT issue flow
- [x] Password reset request + confirm flow
- [x] Auth middleware for protected routes
- [x] Session/account security logging

### E1.2 Role Model

- [x] Base roles defined: Super Admin, Medresa Admin, Teacher
- [x] Role guard middleware implemented
- [ ] Role assignment endpoints (Super Admin controlled) — deferred to M03
- [x] Forbidden access behavior standardized

### E1.3 UI Delivery

- [x] Login + forgot/reset password screens
- [x] Auth-aware route guards in frontend
- [x] Role-aware navigation shell

### E1 DoD

- [x] Auth flows tested (valid/invalid/expired cases)
- [x] Role-protected endpoints enforced
- [x] Audit records for auth-critical actions verified

---

## Epic E2: M02 Medresa Management (Sprint 2)

### E2.1 Medresa CRUD

- [x] Medresa schema + migration
- [x] Create/edit/list/detail medresa endpoints
- [x] Activate/deactivate medresa workflow
- [x] Duplicate medresa validation rules

### E2.2 Access + Isolation

- [x] Super Admin-only write access for medresa CRUD
- [x] Deactivated medresa operational restrictions
- [x] Tenant scoping helper introduced for reuse

### E2.3 UI Delivery

- [x] Super Admin medresa list page
- [x] Medresa create/edit form
- [x] Status controls (active/inactive)

### E2 DoD

- [ ] CRUD and status transitions pass integration tests
- [x] Non-Super Admin cannot mutate medresa data

---

## Epic E3: M03 Teacher Management (Sprint 3)

### E3.1 Teacher Domain

- [x] Teacher schema + migration (network-level entity)
- [x] Teacher creation auto-links a user account
- [x] Teacher profile CRUD (with active/inactive)

### E3.2 Teacher-Medresa Assignment

- [x] `teacher_medresa` join model + migration
- [x] Assign/unassign teacher to medresa endpoint
- [x] Per-medresa role flag (teacher/admin) supported
- [x] Prevent duplicate active assignment

### E3.3 UI Delivery

- [x] Teacher management list/detail pages
- [x] Assignment UI by medresa
- [x] Per-medresa role elevation controls

### E3 DoD

- [x] Same teacher can hold different roles across medresas
- [x] Assignment history appears in audit logs

---

## Epic E4: M04 Course Management (Sprint 4)

### E4.1 Course Catalog

- [x] Course schema + migration
- [x] Super Admin can create/edit global course definitions
- [x] Course status lifecycle supported

### E4.2 Medresa Activation + Teacher Assignment

- [x] Medresa-level course activation relation
- [x] Assign only teachers already assigned to that medresa
- [x] Assignment conflict checks + validation errors

### E4.3 UI Delivery

- [x] Global course catalog screen (Super Admin)
- [x] Medresa course activation screen (Medresa Admin)
- [x] Teacher assignment panel per course

### E4 DoD

- [x] Invalid cross-medresa assignment blocked at API and UI
- [x] Course flows covered with integration tests

---

## Epic E5: M05 Student Management (Sprint 5)

### E5.1 Student Records

- [x] Student schema + migration
- [x] Student CRUD within medresa scope
- [ ] Enrollment number uniqueness policy per medresa (deferred — not in master spec)
- [x] Student status lifecycle (active/transferred/inactive)

### E5.2 Enrollment Flows

- [x] Student-medresa relationship enforced
- [x] Student-course enrollment with rule checks
- [x] Enrollment constraints: active course + assigned teacher

### E5.3 UI Delivery

- [x] Student registry (filter/search)
- [x] Student create/edit screens
- [x] Enrollment management section

### E5 DoD

- [x] Medresa Admin only accesses own medresa students
- [x] Enrollment integrity checks pass automatically
- [x] Repeatable student API checklist (`make dev-verify-m05` → `scripts/verify-m05-student-api.sh`)

---

## Epic E6: M06 Attendance Tracking (Sprint 6)

### E6.1 Attendance Core

- [x] Attendance schema + migration (Prisma models were pre-provisioned; production DB applied via team migration flow)
- [x] Mark daily attendance by medresa/student (single roll per calendar day; ustaz and Amir can both save)
- [x] Status support (present/absent/late/excused)
- [x] Duplicate daily entry prevention

### E6.2 Corrections + Audit

- [x] Attendance correction flow (same Ethiopian day; optional `note` / `edited_at`; structured “reason” field deferred)
- [x] Full attendance change audit trail (`auditLog` on session create + per-record PATCH; DB trigger model remains for other tables)

### E6.3 UI Delivery

- [x] Teacher attendance entry screen
- [x] Date/course/class filters (medresa course list + overview date pickers; session list query params)
- [x] Attendance summary view (teacher student drill-down + Amir daily table + Super Admin network table)

### E6 DoD

- [x] Teacher can only mark for assigned classes/students
- [x] Daily attendance reliability test coverage exists (`make dev-verify-m06`)

---

## Epic E7: M07 Grades & Results (Sprint 7)

### E7.1 Assessments + Grades

- [x] Grade schema + migration (pre-provisioned; `ExamType`, `Grade`, `GradeEditRequest`)
- [x] Assessment type support (network `ExamType` catalog)
- [x] Grade create workflow (teacher batch entry + edit-request approval)
- [x] Grade range + validation rules (`max_score`, letter auto-calc)

### E7.2 Aggregation

- [x] Course summary computations (weighted % per course)
- [x] Student result view generation (GPA v1 + per-course breakdown)

### E7.3 UI Delivery

- [x] Teacher grade entry interface (`/teacher/grades`, entry page; exam-type-first flow)
- [x] Grade edit request UI (S35) + Amir/Super Admin approval queues
- [x] Gradebook by course (class results + exam-type filter)
- [x] Student results page (S37) with course/exam filters; summary on student detail
- [x] Exam type edit (trilingual); medresa/network results tables with teacher column
- [x] `useMedresaContext` on medresa results; expanded API verify (400/403/422)

### E7 DoD

- [x] Only assigned teacher can write grades; roster = enrolled students only
- [x] Grade summary outputs verified by tests (`make dev-verify-m07`)
- [x] **M07 complete** (gap closure done; PDF/dashboard grade widgets/notifications → M10)

---

## Epic E8: M08 Fee Management (Sprint 8)

### E8.1 Fee Setup + Tracking

- [x] Fee schema + migration (pre-provisioned; `FeeStructure`, `FeePayment`, `FeeBalance`)
- [x] Fee obligations generated per student (enrollment → current Ethiopian month)
- [x] Payment recording (partial/full)
- [x] Outstanding balance calculation (`FeeBalance` + carryover on collection)

### E8.2 Operational Controls

- [x] Payment method and receipt metadata capture
- [x] Reversal/adjustment policy with audit reasons (Super Admin void)

### E8.3 UI Delivery

- [x] Fee ledger by student (`/medresa/students/:id/fees`)
- [x] Payment entry form (`/medresa/fees/record`)
- [x] Medresa fee collection + network overview dashboards

### E8 DoD

- [x] Fee data inaccessible to Teacher role
- [x] Cross-medresa fee access denied and tested (`make dev-verify-m08`)
- [x] Module reference doc: `docs/08-fees.md`, `docs/m08-fees-api-tests.md`

---

## Epic E9: M09 Salary Management (Sprint 9)

> **Spec:** `docs/09-salary.md` · **Verify:** `make dev-verify-m09`

### E9.1 Salary Domain

- [x] Prisma models wired (`SalaryRank`, `TeacherRank`, `SalaryPayment`)
- [x] Salary rank CRUD + versioned amount (`POST/PATCH /salary-ranks`)
- [x] Assign rank to teacher (`POST /salary/teachers/:id/rank`, `GET rank-history`)
- [x] Payment list with PAID/UNPAID for Ethiopian month (`GET /salary-payments`)
- [x] Record payment (`POST /salary-payments`, unique per teacher/month/year)
- [x] Teacher salary history + network overview APIs
- [x] Monthly unpaid-teacher cron (`Africa/Addis_Ababa`)

### E9.2 Security Hardening

- [x] `requireSuperAdmin` on every M09 route (403 for Amir + Teacher)
- [x] Salary endpoints excluded from non–Super Admin menus/routes
- [x] AuditLog on rank create, rank assign, payment record
- [x] No salary fields leaked in teacher/student/medresa DTOs

### E9.3 UI Delivery

- [x] S43 Salary rank management (`/admin/salary-ranks`)
- [x] S44 Assign rank (modal on payment list)
- [x] S45 Salary payment list (`/admin/salaries`)
- [x] S46 Record payment (`/admin/salaries/record`)
- [x] Teacher salary history (`/admin/teachers/$teacherId/salary`)
- [x] `make dev-verify-m09` + `docs/m09-salaries-api-tests.md`

### E9 DoD

- [x] Zero salary visibility to Medresa Admin/Teacher (API + UI)
- [x] Salary audit trails complete and queryable

---

## Epic E10: M10 Reporting & Dashboard (Sprint 10)

### E10.1 Dashboards

- [x] Super Admin network-wide KPI dashboard
- [x] Medresa Admin medresa-only dashboard
- [x] Teacher class-level dashboard

### E10.2 Reporting

- [x] Enrollment reports
- [x] Attendance reports
- [x] Grades/performance reports
- [x] Fees/salary reports by role permissions

### E10.3 Exports

- [x] PDF export pipeline (client-side jsPDF)
- [x] Spreadsheet export pipeline (client-side SheetJS)

### E10 DoD

- [x] Reports read from existing M01-M09 tables (no new core tables)
- [x] Role-scoped report visibility validated (`make dev-verify-m10`)

---

## Epic E11: Medresa Admin UX (Sprint 11+)

**Backlog (locked):** `docs/ux-backlog/Medresa-Admin-UX.md` — UX-MA-01 through UX-MA-07  
**Implement in order:** MA-01 → MA-05 → MA-03 → MA-02 → MA-04 → MA-06 → MA-07

### E11.1 UX-MA-01 Student hub (P0)

- [x] Tabbed `/medresa/students/$studentId`: Profile | Courses | Attendance | Grades | Fees
- [x] Wire attendance tab to `GET /api/v1/attendance/students/:studentId`
- [x] Remove student detail M06 placeholder copy
- [x] Deep-link tabs (`?tab=`); i18n `en` / `am` / `ar`
- [x] Legacy routes `/results` and `/fees` redirect to hub tabs

### E11.2 UX-MA-05 Fee flow from student hub (P1)

- [x] Record payment from student Fees tab (depends E11.1)
- [x] Return to Fees tab after success (`returnTab=fees`); preserve `medresaId`

### E11.3 UX-MA-03 Course workspace (P1)

- [ ] Tabbed course page: Overview | Roster | Attendance | Results | Teacher
- [ ] Medresa admin results at `/medresa/courses/$id/results` (not teacher route)
- [ ] Clear placeholder copy where features exist

### E11.4 UX-MA-02 Dashboard command center (P1)

- [ ] Clickable course rows → course workspace
- [ ] Pending grade edits count + link
- [ ] Today attendance incomplete indicator + link
- [ ] Outstanding fees card → `/medresa/fees`

### E11.5 UX-MA-04 Academics nav merge (P2)

- [ ] Consolidate grade-edits + results in sidebar
- [ ] Badge for pending grade edit count
- [ ] Optional `G` `E` shortcut in help

### E11.6 UX-MA-06 Multi-medresa context safety (P2)

- [ ] Medresa name in shell when multiple medresas
- [ ] `medresaId` retained on sidebar navigation
- [ ] Confirm dialogs show medresa name on writes

### E11.7 UX-MA-07 i18n and polish (P3)

- [ ] No hardcoded English in E11 touchpoints
- [ ] RTL check on student hub + course workspace tabs

### E11 DoD

- [ ] All UX-MA acceptance criteria in `docs/ux-backlog/Medresa-Admin-UX.md` marked done
- [ ] Medresa admin UI smoke passes (`docs/seed-dev-credentials.md`)
- [ ] `ui-conventions.md` updated if new patterns (tabs/hubs) are canonical

---

## Cross-Cutting Backlog (All Sprints)

### Security

- [ ] Authorization matrix tests (`role x module x action`)
- [ ] OWASP-aligned validation and sanitization checks
- [ ] Rate limits and brute-force controls for auth endpoints

### Testing

- [ ] Unit test baseline for all modules
- [ ] Integration test suites for each epic
- [ ] E2E smoke flows for 3 roles

### Observability

- [ ] Structured backend logging
- [ ] Error tracking integration
- [ ] Module-level operational metrics

### Performance

- [ ] DB indexing review after each module
- [ ] Query budget checks for major list/report endpoints

### Documentation

- [ ] Keep API docs and example payloads up to date
- [ ] Update operator/admin usage docs per module

---

## Weekly Operating Cadence

- Monday: Sprint planning + dependency check
- Midweek: Demo completed stories in staging
- Friday: Regression pass + backlog grooming

## Ready-to-Start This Week (Suggested)

1. Start `E0.1` and `E0.2` in parallel.
2. Open `E1.1` immediately after auth schema decisions.
3. Add authorization matrix tests before `E2` begins.
