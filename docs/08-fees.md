# M08 — Fee Management

**Status:** Complete (Sprint 8). Backend, UI, and `make dev-verify-m08` shipped. Full manual API regression across all modules is deferred to a later test pass.

Network-wide monthly student fee (Super Admin), payment recording by Amir (Medresa Admin), balances and collection views. **Teachers have no access** (BR-11).

## Calendar

Fee billing uses **Ethiopian month (1–13) and Ethiopian year** on API and UI. M06 attendance uses **Gregorian** `YYYY-MM-DD` in `Africa/Addis_Ababa`.

## Fee structure (Super Admin)

| Method | Path | Role |
|--------|------|------|
| GET | `/api/v1/fee-structures` | Non-teacher |
| GET | `/api/v1/fee-structures/active` | Non-teacher |
| POST | `/api/v1/fee-structures` | Super Admin |

- One **ACTIVE** structure at a time; new POST deactivates previous rows (history preserved).
- Amounts stored in **cents**; API exposes **ETB** (`monthlyAmountEtb`).

## Payments (Amir)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/fee-payments` | Record payment (partial allowed, multiple per month) |
| PATCH | `/api/v1/fee-payments/:id/void` | Super Admin soft-delete + audit reason |

Body: `studentId`, `medresaId`, `month`, `year`, `amountPaidEtb`, `paymentMethod` (`CASH` \| `BANK_TRANSFER`), `bankReference` (required for bank), `paymentDate` (`YYYY-MM-DD`, not future), `note?`.

Amir cannot void or edit existing payments (BR-09).

## Collection & history

| Method | Path |
|--------|------|
| GET | `/api/v1/medresas/:medresaId/fees/collection?month=&year=&status=` |
| GET | `/api/v1/medresas/:medresaId/students/:studentId/fees/history` |
| GET | `/api/v1/medresas/:medresaId/fees/overview?fromMonth=&fromYear=&toMonth=&toYear=` |
| GET | `/api/v1/fees/network-overview?...` | Super Admin |

### Carryover (BR-10)

For Ethiopian month `(M, Y)` per student:

- `monthlyFee` = active structure amount for that month  
- `priorCarryover` = obligations for months before `(M,Y)` minus payments before `(M,Y)`  
- `amountDue` = `monthlyFee + priorCarryover`  
- `amountPaid` = sum of payments in `(M,Y)`  
- `balance` = `amountDue - amountPaid`  
- Status: `PAID` (balance ≤ 0), `UNPAID` (no payment in month), else `PARTIAL`

`FeeBalance` row per `(student, medresa)`: `total_due`, `total_paid`, `outstanding_balance` recomputed on each payment.

## Frontend routes

| Route | Screen |
|-------|--------|
| `/admin/fee-structure` | Set network fee (S39) |
| `/admin/fees` | Network overview |
| `/medresa/fees` | Collection list (S40) |
| `/medresa/fees/record` | Record payment (S41) |
| `/medresa/students/$studentId/fees` | Student history (S42) |

Student detail shows `feeStatus` for Amir / Super Admin (hidden from teachers).

## Verify

`./scripts/verify-m08-fees-api.sh` or `make dev-verify-m08`

## Known gaps (post-M08, optional)

- Super Admin **payment void** — API only (`PATCH /fee-payments/:id/void`); no UI yet  
- `GET .../fees/overview` hook exists; medresa UI uses collection API only  
- Network overview UI fixed to current Ethiopian month (no range picker)

## Deferred (M10)

- Student fee history PDF export  
- Dashboard fee KPI widgets  
- Payment notifications  
- Payment void UI (if not added before M10)
