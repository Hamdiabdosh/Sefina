# M09 salaries — API test checklist

**Status:** M09 complete. Use automated script for smoke verification.

Run against dev stack with seed data (ranks + sample payment to be added in `seed-dev-data.ts`):

```bash
./scripts/verify-m09-salaries-api.sh
# or
make dev-verify-m09
```

## Automated smoke (script)

| # | Case | Expected |
|---|------|----------|
| 1 | Medresa Admin GET `/salary-ranks` | 403 |
| 2 | Teacher GET `/salary-payments` | 403 |
| 3 | Super Admin POST salary rank | 201 |
| 4 | Super Admin POST assign teacher rank | 201 |
| 5 | Super Admin POST payment without bank reference | 422 |
| 6 | Super Admin POST duplicate (same teacher/month/year) | 409 |
| 7 | Super Admin POST payment with future date | 400 |
| 8 | Super Admin POST adjusted amount without reason | 422 |
| 9 | Super Admin GET network overview | 200 |

## Manual cases (later regression)

| # | Case | Expected |
|---|------|----------|
| 10 | Rank amount edit creates new version; old row preserved | History query shows both |
| 11 | Deactivate rank; teachers on rank unchanged | Still paid at old rank until reassigned |
| 12 | Change teacher rank mid-year | Payments use rank effective for that month |
| 13 | Deactivated teacher | Not on unpaid list; history readable |
| 14 | Cron (or manual trigger) | Prior month unpaid teachers flagged |

Credentials: `docs/seed-dev-credentials.md`
