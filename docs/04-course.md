# M04 — Course Management

## Backend (`backend/src/modules/m04-course/`)

### Master catalog (Super Admin)

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/courses` | Super Admin |
| POST | `/api/v1/courses` | Super Admin |
| GET | `/api/v1/courses/:id` | Super Admin |
| PATCH | `/api/v1/courses/:id` | Super Admin |
| PATCH | `/api/v1/courses/:id/deactivate` | Super Admin |
| PATCH | `/api/v1/courses/:id/reactivate` | Super Admin |

### Per-medresa courses

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/medresas/:medresaId/courses` | Medresa Admin, Super Admin |
| GET | `/api/v1/medresas/:medresaId/courses/available` | Medresa Admin, Super Admin |
| GET | `/api/v1/medresas/:medresaId/courses/teachers` | Medresa Admin, Super Admin |
| POST | `/api/v1/medresas/:medresaId/courses` | Medresa Admin, Super Admin |
| GET | `/api/v1/medresas/:medresaId/courses/:medresaCourseId` | Medresa Admin, Teacher (assigned), Super Admin |
| PATCH | `/api/v1/medresas/:medresaId/courses/:medresaCourseId/deactivate` | Medresa Admin, Super Admin |
| POST | `/api/v1/medresas/:medresaId/courses/:medresaCourseId/teacher` | Medresa Admin, Super Admin |

Master course `name` and `description` are JSON (`en` required; `am`/`ar` optional). Course English name must be unique network-wide.

Teacher assignment requires the teacher to already be assigned to the medresa via M03 (`TeacherMedresa`). One active teacher per course per medresa.

## Frontend (`frontend/src/features/courses/`)

| Route | Screen |
|-------|--------|
| `/admin/courses` | S15 Master course list |
| `/medresa/courses` | S17 Medresa course list |
| `/medresa/courses/$medresaCourseId` | S19 Course detail |

Super Admin nav includes **Courses**. Medresa Admin nav includes **Courses** (with medresa picker when admin of multiple medresas).
