# M09 — Salary Management

**Status:** Complete (Sprint 9). Backend, UI, and `make dev-verify-m09` shipped.

**Owner:** Super Admin **only** (BR-01, BR-12). Medresa Admin and Teacher get **403** on every salary endpoint and must see **zero** salary UI or fields.

**Depends on:** M01 (auth), M02 (medresas), M03 (teachers).

**Calendar:** Ethiopian month (1–13) and year for billing periods (same convention as M08 fees).

---

## Folders (planned)

| Layer | Path |
|-------|------|
| Backend | `backend/src/modules/m09-salaries/` |
| Frontend | `frontend/src/features/salaries/` |
| Middleware | `requireSuperAdmin` on all M09 routes |
| Verify | `scripts/verify-m09-salaries-api.sh`, `make dev-verify-m09` |

---

## Business rules

| Code | Rule |
|------|------|
| BR-01 | Super Admin exclusive — no other role |
| BR-02 | Salary from **network-wide rank**, not per medresa |
| BR-03 | Exactly **one active rank** per teacher at a time |
| BR-04 | Rank **assignments** versioned (`TeacherRank` + `effective_from`) |
| BR-05 | Rank **amount** changes versioned — history never hard-deleted |
| BR-06 | **One** `SalaryPayment` per `(teacher, month, year)` — DB unique constraint |
| BR-07 | **Bank reference** required on every payment |
| BR-08 | `payment_date` cannot be in the future |
| BR-09 | If `amount_paid` ≠ rank `monthly_amount` → `is_adjusted=true`, `adjustment_reason` required |
| BR-10 | Cron on 1st of month flags teachers unpaid for prior month |
| BR-11 | Deactivated teacher: no new obligations; history preserved |
| BR-12 | Zero visibility for Medresa Admin / Teacher (API + UI + student/teacher DTOs) |

---

## Data model (existing in Prisma)

- **SalaryRank** — trilingual `name` JSON, `monthly_amount` (cents), `effective_from`, `status`, soft `deleted_at`
- **TeacherRank** — `teacher_id`, `salary_rank_id`, `effective_from`, version history
- **SalaryPayment** — `teacher_id`, `salary_rank_id`, `month`, `year`, `amount_paid`, `bank_reference`, `payment_date`, `note`, `is_adjusted`, `adjustment_reason`, `recorded_by` (user id string)

Amounts: **integer cents** in DB; API exposes **ETB** (mirror M08).

---

## API (planned)

### Salary ranks (Super Admin)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/salary-ranks` | Active ranks + teacher counts |
| GET | `/api/v1/salary-ranks/history` | All versions |
| POST | `/api/v1/salary-ranks` | Create rank |
| PATCH | `/api/v1/salary-ranks/:id` | Edit (new version row when amount changes) |
| PATCH | `/api/v1/salary-ranks/:id/deactivate` | Deactivate (does not unassign teachers) |

### Teacher rank (Super Admin)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/teachers/:id/rank` | Assign/change rank `{ salaryRankId, effectiveFrom }` |
| GET | `/api/v1/teachers/:id/rank-history` | Assignment history |

### Payments (Super Admin)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/salary-payments` | List teachers: rank, amount, PAID/UNPAID for month; filters rank/status/month |
| POST | `/api/v1/salary-payments` | Record payment |
| GET | `/api/v1/teachers/:id/salary-history` | Per-teacher ledger + year summary |
| GET | `/api/v1/salaries/network-overview` | Monthly network totals; month range + rank filters |

POST body (planned): `teacherId`, `month`, `year`, `amountPaidEtb`, `bankReference`, `paymentDate`, `note?`, `isAdjusted?`, `adjustmentReason?` (required when adjusted).

### Cron

- **1st of each month, 06:00 `Africa/Addis_Ababa`** — flag active teachers without payment for **previous** Ethiopian month (feeds unpaid banner / overview).

### Deferred (M10)

- `GET .../salary-history/pdf`
- `GET .../network-overview/pdf`
- Dashboard salary KPI widgets (network dashboard mockup in `docs/sefinet_dashboards.html`)
- R04 Salary Report (`GET /api/v1/reports/salary`)

---

## Frontend routes (planned)

| Route | Screen | Spec ID |
|-------|--------|---------|
| `/admin/salary-ranks` | Rank management (create/edit/deactivate) | S43 |
| `/admin/teachers` (rank column + modal) or `/admin/salary-ranks/assign` | Assign rank to teacher | S44 |
| `/admin/salaries` | Payment list (paid/unpaid, filters) | S45 |
| `/admin/salaries/record` | Record payment | S46 |
| `/admin/teachers/$teacherId/salary` | Teacher salary history | (from S45 drill-down) |

**Nav:** Super Admin sidebar **Salary** (`ti-wallet`) — must not appear for Amir or Teacher (`navConfig` + route guards).

**Patterns:** Reuse M08 patterns — `PageTopBar` / `PageBody`, Ethiopian month picker, `formatEtb`, cents on wire, audit log on writes.

---

## Security (E9.2)

- Every handler: `requireSuperAdmin` first
- No salary fields on `GET /teachers/me`, medresa dashboards, or student APIs
- Policy tests: Amir + Teacher → **403** on all paths above
- Sensitive writes → `AuditLog` (rank create, rank assign, payment record)

---

## Build order (recommended)

1. Rank CRUD + list/history APIs  
2. Assign rank + resolve “current rank” for a teacher on a date  
3. Payment list (PAID/UNPAID for Ethiopian month)  
4. Record payment + validation (duplicate month, future date, adjustment reason)  
5. Teacher history + network overview  
6. Cron job for unpaid flags  
7. Frontend screens S43–S46 + nav  
8. `verify-m09-salaries-api.sh` + `make dev-verify-m09`  
9. Seed dev sample ranks + one payment (optional, in `seed-dev-data.ts`)

---

## Task board mapping (`docs/Sefinet_Task_Board.md` Epic E9)

| Story | Deliverable |
|-------|-------------|
| E9.1 | Schema migration verify, rank config, payroll records, payment history APIs |
| E9.2 | Super Admin-only enforcement, no cross-role nav/routes |
| E9.3 | Rank UI, payment list/record, history screens |
| E9 DoD | Zero salary visibility to non–Super Admin; audit trail queryable |

---

## Verify

```bash
./scripts/verify-m09-salaries-api.sh
# or
make dev-verify-m09
```

Manual checklist: `docs/m09-salaries-api-tests.md`

---

## Contrast with M08 (fees)

| | M08 Fees | M09 Salary |
|---|----------|------------|
| Who records payments | Medresa Admin (Amir) | Super Admin only |
| Who sets the rate | Super Admin (network fee structure) | Super Admin (salary ranks) |
| Subject | Students | Teachers |
| Payment methods | Cash or bank | Bank reference **only** |
| Partial payments | Yes (multiple per month) | No — one payment per teacher per month |
| Teacher access | None | None |
| Amir access | Own medresa fees | **None** |
