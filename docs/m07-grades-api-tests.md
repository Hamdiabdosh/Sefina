# M07 grades — API test checklist

Run against a dev stack with seed data:

```bash
./scripts/verify-m07-grades-api.sh
# or
make dev-verify-m07
```

## Manual cases

| # | Case | Expected |
|---|------|----------|
| 1 | Super Admin creates exam types totaling 100% weight | 201 |
| 2 | Create exam type pushing active sum over 100% | 400 `WEIGHT_SUM_INVALID` |
| 3 | Teacher batch grades assigned course student | 201, letter grade set |
| 4 | Score above `max_score` | 400 `SCORE_OUT_OF_RANGE` |
| 5 | Duplicate grade same student/course/exam | 409 `GRADE_ALREADY_EXISTS` |
| 6 | Teacher edit request | 201, grade unchanged until approve |
| 7 | Amir approve edit | 200, grade updated |
| 8 | Reject without `rejectionReason` | 422 |
| 9 | Amir reads other medresa pending list | 403 |
| 10 | GET student/course/medresa/network results | 200 |

The verify script (`./scripts/verify-m07-grades-api.sh`) automates cases 2, 4, 5 (unassigned roster), 8–9, and cross-medresa Amir list (403). Case 8 (reject without reason) runs when a second edit request can be created after approve.

Credentials: `docs/seed-dev-credentials.md`
