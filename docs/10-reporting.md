# M10 — Reporting & Dashboard

**Status:** Complete (Sprint 10). Read-only aggregates over M01–M09; no new Prisma tables.

## API

### Dashboards

| Method | Path | Role |
|--------|------|------|
| GET | `/api/v1/dashboard/teacher` | Teacher |
| GET | `/api/v1/dashboard/medresa?medresaId=` | Medresa Admin; Super Admin requires `medresaId` |
| GET | `/api/v1/dashboard/super-admin` | Super Admin only |

### Reports (JSON preview)

| Code | Path | Roles |
|------|------|-------|
| R01 | `GET /api/v1/reports/enrollment` | Amir, Super Admin |
| R02 | `GET /api/v1/reports/attendance` | Teacher, Amir, Super Admin |
| R03 | `GET /api/v1/reports/fees` | Amir, Super Admin (network if no `medresaId`) |
| R04 | `GET /api/v1/reports/salary` | Super Admin only |
| R05 | `GET /api/v1/reports/grades` | Teacher, Amir, Super Admin |

Shared query params: `fromMonth`, `fromYear`, `toMonth`, `toYear`, optional `medresaId`, `medresaCourseId`, `studentId`, `status`, `feeStatus`, `paymentStatus`, `from`/`to` (Gregorian `YYYY-MM-DD` for attendance).

Exports: **client-side** PDF (jsPDF) and Excel (SheetJS) from report JSON in the frontend.

## Frontend routes

| Route | Screen |
|-------|--------|
| `/teacher/dashboard` | Teacher KPIs + charts |
| `/medresa/dashboard` | Amir KPIs + charts |
| `/admin/dashboard` | Network KPIs + charts |
| `/teacher/reports` | R02, R05 |
| `/medresa/reports` | R01–R03, R05 |
| `/admin/reports` | R01–R05 |

## Verify

```bash
make dev-verify-m10
# or
./scripts/verify-m10-reports-api.sh
```

See [m10-reports-api-tests.md](m10-reports-api-tests.md).

## Deferred carryover (optional)

- M07: grade-edit notifications, academic year on grades
- M08: payment void UI, payment notifications
- Server-generated PDF blobs (if required for headless export)
