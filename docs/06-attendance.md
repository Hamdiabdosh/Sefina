# M06 — Attendance tracking

Teachers record daily attendance per activated medresa course (one session per course per Gregorian calendar day in **Africa/Addis_Ababa**). Amir (Medresa Admin) and Super Admin have **read-only** analytics endpoints.

## Data model

- `AttendanceSession` — `@@unique([medresa_course_id, date])`; `teacher_id` is the actively assigned ustaz from `CourseAssignment`.
- `AttendanceRecord` — `@@unique([session_id, student_id])`; `AttendanceStatus`: `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`.
- `is_locked` — after an Ethiopian calendar day ends, cron plus startup catch-up forbid `PATCH`; same-day edits only while `date == today_et` and not locked.

## API (JWT)

Base: `/api/v1`

### Teacher-only (requires `Teacher` role for the medresa of the course)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/attendance/sessions` | Body: `{ medresaCourseId, date, records[] }`. Roster defaults missing students to **ABSENT**; rejects unknown students. |
| PATCH | `/attendance/sessions/:sessionId` | Body: `{ records: [{ studentId, status?, note? }] }`; same Ethiopian day only; forbidden when locked. |
| GET | `/attendance/sessions` | Query: `medresaCourseId?`, `from?`, `to?` (`YYYY-MM-DD`). |
| GET | `/attendance/sessions/today-session?medresaCourseId=` | Shortcut for Ethiopia “today”. |
| GET | `/attendance/students/:studentId` | History + summary for roster students tied to assigned courses of this ustaz. |

### Amir / Super Admin — read overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/medresas/:medresaId/attendance/overview` | Query: `date` (required), `medresaCourseId?`, `teacherId?`. |

### Super Admin — network rollup

| Method | Path | Description |
|--------|------|-------------|
| GET | `/attendance/network-overview` | Query: `from`, `to`, `medresaId?` — aggregates by medresa and date in range. |

## Business rules

- No **future** `date` (Ethiopian calendar comparison).
- **409** duplicate when a session exists for `(medresaCourseId, date)`.
- Writes always **blocked** for Super Admin as teacher-only routes rely on ustaz JWT (Super Admin bypasses Amir guard but remains non-teacher unless given `Teacher` assignments).
- **Attendance rate** in student history: `(PRESENT + LATE + EXCUSED) / total sessions × 100`, two decimal places server-side.

## Automation

See [m06-attendance-api-tests.md](m06-attendance-api-tests.md) and `./scripts/verify-m06-attendance-api.sh`.
