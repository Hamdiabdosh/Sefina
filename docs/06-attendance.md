# M06 — Attendance tracking

Teachers (ustaz) and Amir (Medresa Admin) record **one attendance roll per medresa per Gregorian calendar day** in **Africa/Addis_Ababa**. Super Admin has **read-only** network analytics; Super Admin JWT is **blocked** from `POST`/`PATCH` attendance.

## Data model

- `AttendanceSession` — `@@unique([medresa_id, date])`; roster is **all active students** with `current_medresa_id` for that medresa.
- `teacher_id` — optional; set when a teacher account first created the session.
- `teacher_marked_at` / `admin_marked_at` — last time a user with TEACHER vs ADMIN medresa role saved record changes for that session (same Ethiopian day).
- `AttendanceRecord` — `@@unique([session_id, student_id])`; `AttendanceStatus`: `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`.
- `is_locked` — after an Ethiopian calendar day ends, cron plus startup catch-up forbid `PATCH`; same-day edits only while `date == today_et` and not locked.

## API (JWT)

Base: `/api/v1`

### Writers (TEACHER or ADMIN at the medresa; not Super Admin)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/attendance/roster?medresaId=` | Active students at medresa (must be allowed to write attendance for that medresa). |
| POST | `/attendance/sessions` | Body: `{ medresaId, date, records[] }`. Roster defaults missing students to **ABSENT**; rejects unknown students. |
| PATCH | `/attendance/sessions/:sessionId` | Body: `{ records: [{ studentId, status?, note? }] }`; same Ethiopian day only; forbidden when locked. |
| GET | `/attendance/sessions` | Query: `medresaId?`, `from?`, `to?` (`YYYY-MM-DD`). |
| GET | `/attendance/sessions/today-session?medresaId=` | Shortcut for Ethiopia “today”. |

### Authenticated readers (teacher, Amir, Super Admin — subject to student access rules)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/attendance/students/:studentId` | History + summary where the viewer may read the student |

### Amir / Super Admin — medresa overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/medresas/:medresaId/attendance/overview` | Query: `date` (required). At most **one row** — the roll for that medresa and date. |

### Super Admin — network rollup

| Method | Path | Description |
|--------|------|-------------|
| GET | `/attendance/network-overview` | Query: `from`, `to`, `medresaId?` — aggregates by medresa and date in range. |

## Business rules

- No **future** `date` (Ethiopian calendar comparison).
- **409** duplicate when a session exists for `(medresaId, date)`.
- **Super Admin** cannot `POST`/`PATCH` attendance (writers middleware).
- **Attendance rate** in student history: `(PRESENT + LATE + EXCUSED) / total sessions × 100`, two decimal places server-side.

## Automation

See [m06-attendance-api-tests.md](m06-attendance-api-tests.md) and `./scripts/verify-m06-attendance-api.sh`.

## Troubleshooting

### `POST /attendance/sessions` returns **500** or **503**

Usually the **database migration** was not applied and/or **`npx prisma generate`** was not run after pulling changes. The runtime Prisma client must match `schema.prisma`, and Postgres must have `AttendanceSession.medresa_id` (not only `medresa_course_id`).

1. From `backend/`: `npx prisma migrate deploy`
2. Then: `npx prisma generate`
3. Restart `npm run dev`

If generate fails with **EACCES** on `prisma/generated/`, fix ownership of that folder and retry generate.
