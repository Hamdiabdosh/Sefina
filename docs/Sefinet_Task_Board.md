# Sefinet Al Neja — Execution Task Board

This board translates `docs/Sefinet_Implementation_Roadmap.md` into actionable epics and sprint-ready stories.

## Status Legend

- `[ ]` Not started
- `[-]` In progress
- `[x]` Done
- `[!]` Blocked

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

- [ ] Medresa schema + migration
- [ ] Create/edit/list/detail medresa endpoints
- [ ] Activate/deactivate medresa workflow
- [ ] Duplicate medresa validation rules

### E2.2 Access + Isolation

- [ ] Super Admin-only write access for medresa CRUD
- [ ] Deactivated medresa operational restrictions
- [ ] Tenant scoping helper introduced for reuse

### E2.3 UI Delivery

- [ ] Super Admin medresa list page
- [ ] Medresa create/edit form
- [ ] Status controls (active/inactive)

### E2 DoD

- [ ] CRUD and status transitions pass integration tests
- [ ] Non-Super Admin cannot mutate medresa data

---

## Epic E3: M03 Teacher Management (Sprint 3)

### E3.1 Teacher Domain

- [ ] Teacher schema + migration (network-level entity)
- [ ] Teacher creation auto-links a user account
- [ ] Teacher profile CRUD (with active/inactive)

### E3.2 Teacher-Medresa Assignment

- [ ] `teacher_medresa` join model + migration
- [ ] Assign/unassign teacher to medresa endpoint
- [ ] Per-medresa role flag (teacher/admin) supported
- [ ] Prevent duplicate active assignment

### E3.3 UI Delivery

- [ ] Teacher management list/detail pages
- [ ] Assignment UI by medresa
- [ ] Per-medresa role elevation controls

### E3 DoD

- [ ] Same teacher can hold different roles across medresas
- [ ] Assignment history appears in audit logs

---

## Epic E4: M04 Course Management (Sprint 4)

### E4.1 Course Catalog

- [ ] Course schema + migration
- [ ] Super Admin can create/edit global course definitions
- [ ] Course status lifecycle supported

### E4.2 Medresa Activation + Teacher Assignment

- [ ] Medresa-level course activation relation
- [ ] Assign only teachers already assigned to that medresa
- [ ] Assignment conflict checks + validation errors

### E4.3 UI Delivery

- [ ] Global course catalog screen (Super Admin)
- [ ] Medresa course activation screen (Medresa Admin)
- [ ] Teacher assignment panel per course

### E4 DoD

- [ ] Invalid cross-medresa assignment blocked at API and UI
- [ ] Course flows covered with integration tests

---

## Epic E5: M05 Student Management (Sprint 5)

### E5.1 Student Records

- [ ] Student schema + migration
- [ ] Student CRUD within medresa scope
- [ ] Enrollment number uniqueness policy per medresa
- [ ] Student status lifecycle (active/transferred/inactive)

### E5.2 Enrollment Flows

- [ ] Student-medresa relationship enforced
- [ ] Student-course enrollment with rule checks
- [ ] Enrollment constraints: active course + assigned teacher

### E5.3 UI Delivery

- [ ] Student registry (filter/search)
- [ ] Student create/edit screens
- [ ] Enrollment management section

### E5 DoD

- [ ] Medresa Admin only accesses own medresa students
- [ ] Enrollment integrity checks pass automatically

---

## Epic E6: M06 Attendance Tracking (Sprint 6)

### E6.1 Attendance Core

- [ ] Attendance schema + migration
- [ ] Mark daily attendance by teacher/course/student
- [ ] Status support (present/absent/late/excused)
- [ ] Duplicate daily entry prevention

### E6.2 Corrections + Audit

- [ ] Attendance correction flow (with reason)
- [ ] Full attendance change audit trail

### E6.3 UI Delivery

- [ ] Teacher attendance entry screen
- [ ] Date/course/class filters
- [ ] Attendance summary view

### E6 DoD

- [ ] Teacher can only mark for assigned classes/students
- [ ] Daily attendance reliability test coverage exists

---

## Epic E7: M07 Grades & Results (Sprint 7)

### E7.1 Assessments + Grades

- [ ] Grade schema + migration
- [ ] Assessment type support (quiz/exam/assignment/etc.)
- [ ] Grade create/update workflow
- [ ] Grade range + validation rules

### E7.2 Aggregation

- [ ] Term/course summary computations
- [ ] Student result view generation

### E7.3 UI Delivery

- [ ] Teacher grade entry interface
- [ ] Gradebook by course/term
- [ ] Student result view (role-scoped)

### E7 DoD

- [ ] Only assigned teacher can write grades
- [ ] Grade summary outputs verified by tests

---

## Epic E8: M08 Fee Management (Sprint 8)

### E8.1 Fee Setup + Tracking

- [ ] Fee schema + migration
- [ ] Fee obligations generated per student
- [ ] Payment recording (partial/full)
- [ ] Outstanding balance calculation

### E8.2 Operational Controls

- [ ] Payment method and receipt metadata capture
- [ ] Reversal/adjustment policy with audit reasons

### E8.3 UI Delivery

- [ ] Fee ledger by student
- [ ] Payment entry form
- [ ] Medresa fee status dashboard

### E8 DoD

- [ ] Fee data inaccessible to Teacher role
- [ ] Cross-medresa fee access denied and tested

---

## Epic E9: M09 Salary Management (Sprint 9)

### E9.1 Salary Domain

- [ ] Salary schema + migration
- [ ] Salary scale configuration
- [ ] Payroll run record model
- [ ] Payment history per teacher/medresa

### E9.2 Security Hardening

- [ ] Super Admin-only API enforcement
- [ ] Salary endpoints excluded from non-Super Admin menus/routes
- [ ] Sensitive actions require elevated confirmation flow

### E9.3 UI Delivery

- [ ] Salary configuration and payroll screens
- [ ] Salary history and payment logs

### E9 DoD

- [ ] Zero salary visibility to Medresa Admin/Teacher (API + UI)
- [ ] Salary audit trails complete and queryable

---

## Epic E10: M10 Reporting & Dashboard (Sprint 10)

### E10.1 Dashboards

- [ ] Super Admin network-wide KPI dashboard
- [ ] Medresa Admin medresa-only dashboard
- [ ] Teacher class-level dashboard

### E10.2 Reporting

- [ ] Enrollment reports
- [ ] Attendance reports
- [ ] Grades/performance reports
- [ ] Fees/salary reports by role permissions

### E10.3 Exports

- [ ] PDF export pipeline
- [ ] Spreadsheet export pipeline

### E10 DoD

- [ ] Reports read from existing M01-M09 tables (no new core tables)
- [ ] Role-scoped report visibility validated

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
