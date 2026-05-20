# M08 fees — API test checklist

**Note:** M08 implementation is complete. Use the automated script below for smoke verification now; the full manual matrix below is for a later project-wide API regression pass.

Run against a dev stack with seed data (`npm run db:seed:dev` includes fee structure + sample payment):

```bash
./scripts/verify-m08-fees-api.sh
# or
make dev-verify-m08
```

## Manual cases

| # | Case | Expected |
|---|------|----------|
| 1 | Teacher GET `/fee-structures/active` | 403 |
| 2 | Amir GET collection for own medresa | 200 |
| 3 | Amir GET collection for other medresa | 403 |
| 4 | POST payment bank transfer without reference | 400 |
| 5 | POST payment with future date | 400 |
| 6 | Amir POST partial payment | 201 |
| 7 | Super Admin POST new fee structure | 201; prior inactive |
| 8 | Super Admin PATCH void payment | 200 |
| 9 | Super Admin network overview | 200 |

Credentials: `docs/seed-dev-credentials.md`
