# M10 — Reports & dashboard API tests

Run against a dev stack with seed data (`make dev-up`).

```bash
make dev-verify-m10
# or
./scripts/verify-m10-reports-api.sh
```

## Checks

| # | Case | Expected |
|---|------|----------|
| 1 | `GET /dashboard/teacher` (teacher token) | 200 |
| 2 | `GET /dashboard/medresa?medresaId=` (Amir) | 200 |
| 3 | `GET /dashboard/super-admin` (SA) | 200 |
| 4 | `GET /reports/salary` (teacher) | 403 |
| 5 | `GET /reports/salary` (Amir) | 403 |
| 6 | `GET /reports/salary` (SA) | 200 |
| 7 | `GET /reports/enrollment` (Amir, scoped medresa) | 200 |
| 8 | `GET /reports/enrollment` (teacher) | 403 |
| 9 | `GET /reports/fees` (Amir, other medresa) | 403 |
| 10 | `GET /reports/attendance` (teacher) | 200 |
| 11 | `GET /reports/grades` (Amir) | 200 |
| 12 | Teacher dashboard JSON has no salary KPI fields | pass |

## Credentials

See [seed-dev-credentials.md](seed-dev-credentials.md).
