# M05 — Student Management

## Backend (`backend/src/modules/m05-student/`)

### Per-medresa students

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/medresas/:medresaId/students` | Medresa Admin, Super Admin |
| POST | `/api/v1/medresas/:medresaId/students` | Medresa Admin, Super Admin |

`POST` accepts `multipart/form-data` with optional `photo` and fields: `fullName`, `dateOfBirth`, `gender` (`MALE`/`FEMALE`), `address`, `guardianName`, `guardianPhone` (Ethiopian format). Optional: `enrollmentNumber`, `nationalId`, `bloodGroup`, `allergies`, `secondaryGuardianName`, `secondaryGuardianPhone`.

If `enrollmentNumber` is omitted, the server assigns `{ethiopianYear}/{seq}` (e.g. `2018/001`).

List query: `page`, `limit`, `search`, `gender`, `status` (`ACTIVE` \| `TRANSFERRED` \| `WITHDRAWN` \| `GRADUATED`), `medresaCourseId`.

`search` matches: student name, guardian name/phone, address, enrollment number, and course names (localized JSON).

Duplicate create (same medresa + name + date of birth) returns `409 DUPLICATE_STUDENT`.

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
| POST | `/api/v1/students/:id/withdraw` | Medresa Admin — body `{ reason?, withdrawnAt? }` |
| POST | `/api/v1/students/:id/graduate` | Medresa Admin — body `{ graduatedAt? }` |
| POST | `/api/v1/students/:id/reactivate` | Medresa Admin — body `{ reactivatedAt? }` (from `WITHDRAWN` or `GRADUATED`) |

Course assignment requires an **active** medresa course with an **assigned teacher** (M04). Transfer soft-deletes enrollments; destination admin re-assigns courses.

Lifecycle transitions close the open `StudentEnrollmentPeriod` and open a new period on reactivate/transfer (destination).

### Teacher roster

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/teacher/students` | Teacher — students in assigned courses; query `medresaId?` scopes to one medresa. **Amir (ADMIN) at that medresa** receives the full active roster (same visibility as medresa admin list). |

## Database

Apply migrations from `backend/`:

```bash
npm run db:migrate
npx prisma generate   # if generated/ is root-owned from Docker: sudo chown -R "$(whoami)" prisma/generated
```

Migration `20260524120000_student_hardening` adds profile fields, enrollment periods, notes table, and partial indexes.

## Frontend (`frontend/src/features/students/`)

| Route | Screen |
|-------|--------|
| `/medresa/students` | S20 Student list |
| `/medresa/students/$studentId` | S23 Student hub (tabs: `?tab=profile\|courses\|attendance\|grades\|fees`) |
| `/medresa/students/$studentId/results` | Redirects to hub `?tab=grades` |
| `/medresa/students/$studentId/fees` | Redirects to hub `?tab=fees` |
| `/teacher/students` | S26 Teacher student list |

## Verification

- Automated API scenarios: **`make dev-verify-m05`** (see `docs/m05-student-api-tests.md`).
- Full dev dataset smoke: `./scripts/verify-seed-dev.sh` or **`make dev-verify-seed`**.
