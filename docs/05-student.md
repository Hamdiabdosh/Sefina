# M05 — Student Management

## Backend (`backend/src/modules/m05-student/`)

### Per-medresa students

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/medresas/:medresaId/students` | Medresa Admin, Super Admin |
| POST | `/api/v1/medresas/:medresaId/students` | Medresa Admin, Super Admin |

`POST` accepts `multipart/form-data` with optional `photo` and fields: `fullName`, `dateOfBirth`, `gender` (`MALE`/`FEMALE`), `address`, `guardianName`, `guardianPhone` (Ethiopian format).

List query: `page`, `limit`, `search`, `gender`, `status`, `medresaCourseId`.

### Student by id

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/students/transfer-destinations` | Medresa Admin, Super Admin |
| GET | `/api/v1/students/:id` | Medresa Admin (student medresa), Teacher (roster), Super Admin |
| PATCH | `/api/v1/students/:id` | Medresa Admin of student's medresa |
| GET | `/api/v1/students/:id/photo` | Same as GET detail |
| POST | `/api/v1/students/:id/photo` | Medresa Admin |
| POST | `/api/v1/students/:id/courses` | Medresa Admin — body `{ medresaCourseId }` |
| DELETE | `/api/v1/students/:id/courses/:studentCourseId` | Medresa Admin — soft delete |
| POST | `/api/v1/students/:id/transfer` | Medresa Admin — body `{ toMedresaId, transferDate, reason? }` |

Course assignment requires an **active** medresa course with an **assigned teacher** (M04). Transfer soft-deletes enrollments; destination admin re-assigns courses.

### Teacher roster

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/teacher/students` | Teacher — students in assigned courses only |

## Frontend (`frontend/src/features/students/`)

| Route | Screen |
|-------|--------|
| `/medresa/students` | S20 Student list |
| `/medresa/students/$studentId` | S23 Student detail |
| `/teacher/students` | S26 Teacher student list |

Medresa Admin nav includes **Students** (with medresa picker when admin of multiple medresas). Teacher nav includes **Students** (read-only).

## Verification

- Automated API scenarios: **`make dev-verify-m05`** (see `docs/m05-student-api-tests.md`).
- Full dev dataset smoke: `./scripts/verify-seed-dev.sh` or **`make dev-verify-seed`**.
- Manual UI checklist: login steps in `docs/seed-dev-credentials.md` (**UI smoke**).
