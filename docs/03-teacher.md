# M03 — Teacher Management

## Backend (`backend/src/modules/m03-teacher/`)

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/teachers` | Super Admin |
| POST | `/api/v1/teachers` | Super Admin |
| GET | `/api/v1/teachers/me` | Authenticated teacher |
| GET | `/api/v1/teachers/:id` | Super Admin or self |
| PATCH | `/api/v1/teachers/:id` | Super Admin |
| PATCH | `/api/v1/teachers/:id/deactivate` | Super Admin |
| PATCH | `/api/v1/teachers/:id/reactivate` | Super Admin |
| POST | `/api/v1/teachers/:id/photo` | Super Admin |
| GET | `/api/v1/teachers/:id/photo` | Super Admin or self |
| POST | `/api/v1/teachers/:id/medresas` | Super Admin |
| POST | `/api/v1/teachers/:id/medresas/bulk` | Super Admin |
| PATCH | `/api/v1/teachers/:id/medresas/:medresaId` | Super Admin |
| DELETE | `/api/v1/teachers/:id/medresas/:medresaId` | Super Admin |

Creating a teacher auto-creates a linked `User` and sends an invite email (or accepts an optional temporary password). Optional `initialAssignment` on create assigns a medresa with role `TEACHER` or `ADMIN` (UI label: Amir). Assignments use `TeacherMedresa` with per-medresa roles. Photos stored under `UPLOAD_DIR/teachers/`.

Account actions on teacher detail use `POST /api/v1/users/:userId/resend-invite` and `PATCH /api/v1/users/:userId/set-password` (Super Admin only). The standalone Users admin screen and `GET`/`POST /api/v1/users` list/create endpoints were removed.

## Frontend (`frontend/src/features/teachers/`)

| Route | Screen |
|-------|--------|
| `/admin/teachers` | S10 Teacher list |
| `/admin/teachers/$teacherId` | S11 Teacher detail |

Super Admin nav includes **Teachers**. Teacher profile card (`ProfileCard`) loads `/teachers/me` for read-only teacher context.
