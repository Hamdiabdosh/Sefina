# M06 Attendance API — checklist

## Automated (recommended)

```bash
make dev-verify-m06
# or: ./scripts/verify-m06-attendance-api.sh
```

**Prerequisites:** `./scripts/setup-dev.sh` (`make dev-up`) so Postgres + `./scripts/seed-dev-data.ts` cohort exists.

Uses:

- **ustaz06@sefinet.dev** — Quran Recitation assignments (password `Teacher@12345`).
- **admin01@sefinet.dev** — Amir overview smoke.
- Super Admin from env **`SUPER_ADMIN_EMAIL`** / **`SUPER_ADMIN_PASSWORD`** (defaults: `seedSuperAdmin.ts` values).

**Auth limits:** reuse existing rate-limit posture; stagger logins like M05 verification if CI hits thresholds.

---

## Behaviour covered

| # | Assertion |
|---|-----------|
| 1 | Ethiopia “today”: future `POST /attendance/sessions` → `400 ATTENDANCE_FUTURE_DATE` |
| 2 | First submission `201`; repeat same course+day → `409 ATTENDANCE_DUPLICATE_SESSION` |
| 3 | `PATCH` accepts same-day tweaks; increments `edited_at` per changed record server-side |
| 4 | `GET /attendance/students/:id` aggregates counts + chronological entries |
| 5 | `GET …/medresas/:mid/attendance/overview` Amir → `200` |
| 6 | `GET …/medresas/:mid/attendance/overview` ustaz JWT → `403 FORBIDDEN` |
| 7 | `GET /attendance/network-overview` Super Admin → `200` |
| 8 | **Midnight cron** schedules at `Africa/Addis_Ababa`; startup run locks stale `date < today` sessions — manual QA if production clock skew arises |
