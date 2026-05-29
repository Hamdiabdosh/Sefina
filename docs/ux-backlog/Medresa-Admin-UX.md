# Medresa Admin — UX & Product Backlog

**Status:** locked (all UX-MA items approved)  
**Persona:** Medresa Admin (Amir) — `ADMIN` on one or more medresas  
**Home route:** `/medresa/dashboard`  
**Canonical task board:** [Sefinet_Task_Board.md](../Sefinet_Task_Board.md) → Epic E11  
**Last locked:** 2026-05-21

---

## Legend

| Term | Meaning |
|------|---------|
| **CAN** | Shipped and reachable in the UI today (regression baseline) |
| **SHOULD** | Approved improvement — implement only when tracked under Epic E11 |
| **Status** | `locked` = approved for implementation; `[-]` in progress; `[x]` done |

---

## Process

1. **CAN** — do not re-implement; verify with UI smoke / module verify scripts.  
2. **SHOULD** — one story ID per PR; acceptance criteria must pass before marking `[x]`.  
3. **Order** — follow [Implementation order](#implementation-order) unless blocked.

---

## CAN — baseline (today)

### Morning / overview

| Capability | Route / entry |
|------------|----------------|
| School KPIs (students, courses, today attendance %, outstanding fees) | `/medresa/dashboard` |
| Fee & enrollment trend charts | Dashboard |
| Per-course stats table (students, attendance %, avg grade) | Dashboard |
| Quick link: fee collection | Dashboard → `/medresa/fees` |
| Quick link: reports | Dashboard → `/medresa/reports` |
| Switch medresa (multi-admin) | `MedresaPicker` + `?medresaId=` |

### Students (M05)

| Capability | Route / entry |
|------------|----------------|
| List, search, filter (status, course) | `/medresa/students` |
| Enroll new student | Students page modal |
| Profile, guardian, courses, transfer | `/medresa/students/$studentId` |
| Fee summary on profile | Student detail → `StudentFeesSummary` |
| Grades summary + full results | Detail → `/medresa/students/$studentId/results` |
| Full fee history | `/medresa/students/$studentId/fees` |

### Courses (M04)

| Capability | Route / entry |
|------------|----------------|
| List medresa courses, activate from catalog | `/medresa/courses` |
| Assign / change teacher | `/medresa/courses/$medresaCourseId` |
| Roster filtered by course | Course detail → students with `medresaCourseId` |
| Class results (shared route) | Course detail → `/teacher/courses/results?medresaCourseId=` |

### Attendance (M06)

| Capability | Route / entry |
|------------|----------------|
| Medresa-wide daily overview (P/A/L/E, markers) | `/medresa/attendance` |
| Take / correct whole-medresa roll | `/medresa/attendance/take` |
| Take attendance from course detail | Course detail link |

### Grades (M07)

| Capability | Route / entry |
|------------|----------------|
| Approve / reject pending edit requests | `/medresa/grade-edits` |
| Results overview by course / teacher | `/medresa/results` |
| Per-student results | `/medresa/students/$studentId/results` |

### Fees (M08)

| Capability | Route / entry |
|------------|----------------|
| Monthly collection list + status filters | `/medresa/fees` |
| Record payment | Fees list → `/medresa/fees/record` |
| Ethiopian month/year on collection | Fees page |

### Reports (M10)

| Capability | Route / entry |
|------------|----------------|
| Enrollment, attendance, fees, grades reports | `/medresa/reports` |
| PDF / XLSX export | Reports page |

### Keyboard shortcuts

| Chord | Destination |
|-------|-------------|
| `G` `D` | Dashboard |
| `G` `C` | Courses |
| `G` `S` | Students |
| `G` `A` | Attendance |
| `G` `F` | Fees |
| `G` `R` | Reports |

### Cannot do (by design)

| Limitation | Reason |
|------------|--------|
| Set network fee structure | Super Admin only — `/admin/fee-structure` |
| Teacher salaries | Super Admin only — M09 |
| Network course catalog CRUD | Super Admin — `/admin/courses` |
| Network teacher CRUD | Super Admin — `/admin/teachers` |

### Known gaps (CAN works elsewhere, not on student detail)

| Gap | Note |
|-----|------|
| Student attendance on profile | UI placeholder; API exists: `GET /api/v1/attendance/students/:studentId` |
| Dashboard course rows | Display only — not clickable |
| Class results URL | Admin uses `/teacher/courses/results` |

---

## SHOULD — locked backlog

### UX-MA-01 — Student hub

- **Status:** done (2026-05-21)  
- **Priority:** P0  
- **Modules:** M05, M06, M07, M08 (frontend)

**Scenario:** Guardian calls about Ahmed: fees, last week’s attendance, and latest exam — Amir should not jump across four sidebar areas.

**Today:** Students → Ahmed → fee summary → separate results route; attendance section shows “coming M06” placeholder.

**Target:** Single student page with tabs: **Profile** | **Courses** | **Attendance** | **Grades** | **Fees**.

**Acceptance criteria:**

- [x] Tabs on `/medresa/students/$studentId` (deep-linkable, e.g. `?tab=fees`)
- [x] Attendance tab uses existing student attendance API (no new core tables)
- [x] Grades and fees fully usable without navigating to orphan routes (routes redirect to tab)
- [x] Remove placeholder / `comingM06` copy on student detail
- [x] i18n keys for tab labels in `en`, `am`, `ar`

**Out of scope:** Fee structure editing; teacher salary.

---

### UX-MA-02 — Dashboard command center

- **Status:** locked  
- **Priority:** P1  
- **Modules:** M10 dashboard (frontend)

**Scenario:** Amir opens the app at 8:00; wants only problems that need action today.

**Today:** KPIs + course table; only “Record payment” and “View reports” footer links.

**Target:** Actionable dashboard: clickable course rows; alert cards for unpaid fees count, pending grade edits, incomplete attendance marking.

**Acceptance criteria:**

- [ ] Each course row links to course workspace (UX-MA-03) or course detail until MA-03 ships
- [ ] Visible count of pending grade edit requests with link to `/medresa/grade-edits`
- [ ] Visible indicator when today’s attendance is incomplete (teacher and/or admin marker)
- [ ] Outstanding fees summary links to `/medresa/fees` with sensible filters
- [ ] Common issues reachable in ≤2 taps from dashboard

**Out of scope:** New report types; email/push notifications.

---

### UX-MA-03 — Course workspace

- **Status:** locked  
- **Priority:** P1  
- **Modules:** M04, M06, M07 (frontend)

**Scenario:** Check Class 3A: assigned teacher, today’s attendance, class average — without three unrelated routes.

**Today:** Course detail → separate links to students list, attendance take, `/teacher/courses/results`.

**Target:** `/medresa/courses/$medresaCourseId` with tabs: **Overview** | **Roster** | **Attendance** | **Results** | **Teacher**.

**Acceptance criteria:**

- [ ] Medresa admin class results under `/medresa/courses/$id/results` (or tab), not `/teacher/courses/results`
- [ ] Roster tab matches filtered students list for this course
- [ ] Attendance tab: today’s status + link to take roll scoped to course where API supports it, else medresa take with context
- [ ] Teacher assign/change remains on Overview or Teacher tab
- [ ] Remove misleading “placeholder” labels where functionality exists

**Out of scope:** New attendance session model per course (use existing medresa/session APIs).

---

### UX-MA-04 — Academics nav merge

- **Status:** locked  
- **Priority:** P2  
- **Modules:** M07 (frontend nav)

**Scenario:** End of term — approve grade edits, then review results; Amir should see pending work before opening the screen.

**Today:** Sidebar items “Grade edits” and “Results” separate; no badge.

**Target:** One **Academics** nav group (or single item with sub-routes): Results + Grade edits; sidebar badge for pending edit count.

**Acceptance criteria:**

- [ ] `navConfig.ts` updated for medresa admin: consolidated academics entry
- [ ] Badge shows pending grade edit count (0 hidden)
- [ ] Routes `/medresa/grade-edits` and `/medresa/results` still work (redirect OK)
- [ ] Optional keyboard chord documented (e.g. `G` `E` for edits) in shortcuts help

**Out of scope:** Changing grade approval business rules.

---

### UX-MA-05 — Fee flow from student hub

- **Status:** done (2026-05-21)  
- **Priority:** P1  
- **Modules:** M08 (frontend)  
- **Depends on:** UX-MA-01 (Fees tab)

**Scenario:** Parent pays at the office while Ahmed’s profile is on screen.

**Today:** Detail → summary → fees list → search student → record payment.

**Target:** **Record payment** primary action on student Fees tab; month pre-filled from collection context.

**Acceptance criteria:**

- [x] Record payment from student Fees tab without visiting global fees list first
- [x] After success, return to same student Fees tab with updated balance/status
- [x] `medresaId` preserved for multi-medresa admins

**Out of scope:** Partial payment rules changes; receipt PDF.

---

### UX-MA-06 — Multi-medresa context safety

- **Status:** locked  
- **Priority:** P2  
- **Modules:** M02 scope (frontend shell)

**Scenario:** Amir admins two medresas; switches picker mid-task and must not post a fee to the wrong school.

**Today:** `MedresaPicker` + `?medresaId=` on many pages; risk if param dropped on navigation.

**Target:** Sticky medresa context in app shell; writes show medresa name on confirm.

**Acceptance criteria:**

- [ ] Selected medresa visible in shell (name) when `hasMultipleMedresas`
- [ ] Navigating via sidebar retains `medresaId` on scoped routes
- [ ] Fee record, enroll, transfer confirm shows medresa name
- [ ] Manual test script in Verification section passes

**Out of scope:** Merging medresas; cross-medresa reporting.

---

### UX-MA-07 — i18n and UX polish

- **Status:** locked  
- **Priority:** P3  
- **Modules:** frontend (cross-cutting)

**Scenario:** Arabic-speaking admin uses RTL on new student hub and course workspace tabs.

**Today:** App shell RTL works; some pages have hardcoded English (e.g. teacher detail patterns elsewhere).

**Target:** All strings introduced in UX-MA-01–06 use i18n; RTL layout verified on tabbed hubs.

**Acceptance criteria:**

- [ ] No new hardcoded user-facing English in MA-01–06 pages
- [ ] Keys added to `en.json`, `am.json`, `ar.json`
- [ ] Tab layouts usable in RTL (manual check on student hub + course workspace)

**Out of scope:** Full-app i18n audit outside MA touchpoints.

---

## Implementation order

| Order | ID | Rationale |
|-------|-----|-----------|
| 1 | UX-MA-01 | Unblocks MA-05; fixes highest daily friction |
| 2 | UX-MA-05 | Depends on MA-01 Fees tab |
| 3 | UX-MA-03 | Course-centric daily ops |
| 4 | UX-MA-02 | Dashboard links into MA-01/03 |
| 5 | UX-MA-04 | Nav cleanup after hubs exist |
| 6 | UX-MA-06 | Safety hardening |
| 7 | UX-MA-07 | Polish pass on MA deliverables |

---

## Verification

### Per story

- UI smoke with medresa admin seed user (`docs/seed-dev-credentials.md`)
- No regression: `make dev-verify-m05`, `make dev-verify-m06`, `make dev-verify-m07`, `make dev-verify-m08` as applicable

### Epic E11 done when

- [ ] All UX-MA-01–07 acceptance criteria checked
- [ ] `navConfig.ts` and `ui-conventions.md` updated if patterns changed
- [ ] This file: each UX-MA status → done with date

### UX-MA-06 manual test

1. Login as admin of Medresa A and B.  
2. Select Medresa A → record fee for student X → confirm shows Medresa A.  
3. Switch to Medresa B → students list shows B only.  
4. Record fee → confirm shows Medresa B.  
5. Reload app → last selected medresa still B (if persistence implemented).

---

## References

- [ui-conventions.md](../ui-conventions.md) — page shell, components  
- [Sefinet-UI-UX-Specification.md](../Sefinet-UI-UX-Specification.md) — design target  
- [05-student.md](../05-student.md), [06-attendance.md](../06-attendance.md), [07-grades.md](../07-grades.md), [08-fees.md](../08-fees.md)
