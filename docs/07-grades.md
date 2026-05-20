# M07 — Grades & Results

Teachers record numeric scores per student/course/exam type. Letter grades are **auto-calculated** server-side. Score corrections use an **approval workflow** (Amir or Super Admin).

## Letter grade scale (BR-03)

| Numeric score | Letter |
|---------------|--------|
| 90–100 | A |
| 80–89 | B |
| 70–79 | C |
| 60–69 | D |
| 0–59 | F |

## Weighted course total

For each course, across **entered** exam types:

`weightedTotalPercent = round( sum( (numericScore / maxScore) * weight ) / sum(weight) * 100, 2 )`

**Overall GPA (v1):** arithmetic mean of per-course `weightedTotalPercent` values where at least one grade exists.

## Exam types (Super Admin)

Active exam type **weights must sum to 100%** (BR-02).

| Method | Path | Role |
|--------|------|------|
| GET | `/api/v1/exam-types` | Authenticated |
| POST | `/api/v1/exam-types` | Super Admin |
| PATCH | `/api/v1/exam-types/:id` | Super Admin |

## Grade entry (Teacher)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/grades/roster?medresaCourseId=&examTypeId=` | Roster + existing grades |
| POST | `/api/v1/grades` | Single grade |
| POST | `/api/v1/grades/batch` | Class batch: `{ medresaCourseId, examTypeId, grades: [{ studentId, numericScore }] }` |
| POST | `/api/v1/grades/:gradeId/edit-requests` | Request correction `{ requestedScore, reason }` |

Super Admin cannot write grades.

## Edit approval

| Method | Path | Role |
|--------|------|------|
| GET | `/api/v1/grade-edit-requests?status=PENDING&medresaId?` | Amir (scoped), Super Admin |
| PATCH | `/api/v1/grade-edit-requests/:id/approve` | Amir, Super Admin |
| PATCH | `/api/v1/grade-edit-requests/:id/reject` | Body: `{ rejectionReason }` required |

Grade row is unchanged until approve (BR-06).

## Results (read)

| Method | Path |
|--------|------|
| GET | `/api/v1/students/:id/results` |
| GET | `/api/v1/medresa-courses/:medresaCourseId/results` |
| GET | `/api/v1/medresas/:medresaId/results/overview` |
| GET | `/api/v1/results/network-overview` |

PDF export deferred to M10.

## Frontend routes (gap closure)

| Route | Screen |
|-------|--------|
| `/admin/exam-types` | Exam type list + create/edit (trilingual name) |
| `/admin/grade-edits` | Super Admin edit approvals |
| `/medresa/grade-edits` | Amir edit approvals |
| `/medresa/results` | Medresa results table (course, teacher, avg, high, low) |
| `/admin/results` | Network results table |
| `/teacher/grades` | Teacher grades hub |
| `/teacher/grades/entry` | Grade entry (exam type first, then roster) |
| `/teacher/grades/edit-request` | Grade edit request (S35) |
| `/teacher/courses/results` | Class results (`?medresaCourseId=`) — teacher, Amir, Super Admin read |
| `/teacher/students/$studentId/results` | Student results (S37) |
| `/medresa/students/$studentId/results` | Student results for Amir / teacher via medresa student detail |

Course results API path: **`/api/v1/medresa-courses/:id/results`** (not `/courses/...`).

Medresa overview rows include **`assignedTeacher`** `{ id, fullName }`. Student detail may include **`gradesSummary`** `{ overallGpaPercent, courseCount }`.

## Verify

`./scripts/verify-m07-grades-api.sh` or `make dev-verify-m07` — includes negative cases (400 weight/score, 403 scope, 422 reject body).
