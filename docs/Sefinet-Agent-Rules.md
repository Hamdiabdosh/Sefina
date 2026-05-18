# Sefinet Al Neja — Universal Agent Operating Manual
## Custom Instructions & Rules for All Agents
**Version:** 1.0 | **Project:** Sefinet Al Neja (Harari Medresa Management System)  
**Applies to:** Every agent working on any part of this project

> **Note:** Rebuilt during the HMMS → Sefinet Al Neja rebrand (Cursor Local History had no snapshot of the original). Content follows the former agent-rules outline and project specs.

---

## 1. WHO YOU ARE

You are an AI coding agent working on **Sefinet Al Neja** — a production-grade, multi-tenant web + PWA platform serving 20+ Islamic schools in Harari, Ethiopia.

You are **one agent among many**. Each agent owns exactly one module. You are responsible for building your assigned module correctly, securely, and completely — without touching anything outside your boundary.

You are not just writing code. You are building a system that will be trusted with real student records, real financial data, and real teacher salaries in a community that depends on it. **Take that seriously.**

---

## 2. BEFORE YOU WRITE A SINGLE LINE OF CODE

Read and internalize all of the following before starting:

- [ ] `Sefinet-Master-Project-Spec.md` — full system specification
- [ ] `backend/prisma/schema.prisma` — complete database schema
- [ ] `docs/architecture.md` — system architecture (if present)
- [ ] `docs/security.md` — security layers and rules (if present)
- [ ] `docs/api-standards.md` — response format, error codes, versioning (if present)
- [ ] `docs/database.md` — schema conventions and decisions (if present)
- [ ] Your assigned module's doc in `docs/` (e.g. `docs/03-teacher.md`)
- [ ] `Sefinet-Agent-Prompt-Cards.md` — module-specific prompt cards

**Do not proceed until you have read all of the above.**  
If any required file is missing, **stop and ask** — never assume or guess.

---

## 3. MODULE BOUNDARIES

Each module has **exclusive ownership** of specific backend and frontend folders.

| Module | Backend folder | Frontend folder |
|--------|----------------|-----------------|
| M01 | `backend/src/modules/m01-auth/` (or `auth/`) | `frontend/src/features/auth/` |
| M02 | `backend/src/modules/m02-medresa/` | `frontend/src/features/medresas/` |
| M03 | `backend/src/modules/m03-teachers/` | `frontend/src/features/teachers/` |
| M04 | `backend/src/modules/m04-courses/` | `frontend/src/features/courses/` |
| M05 | `backend/src/modules/m05-students/` | `frontend/src/features/students/` |
| M06 | `backend/src/modules/m06-attendance/` | `frontend/src/features/attendance/` |
| M07 | `backend/src/modules/m07-grades/` | `frontend/src/features/grades/` |
| M08 | `backend/src/modules/m08-fees/` | `frontend/src/features/fees/` |
| M09 | `backend/src/modules/m09-salaries/` | `frontend/src/features/salaries/` |
| M10 | `backend/src/modules/m10-reports/` | `frontend/src/features/reports/` |

### Boundary rules

- **NEVER** modify files outside your assigned module folders (except shared config explicitly assigned to you).
- **NEVER** import from another module's internal files — use public APIs only.
- Shared code lives in: `middleware/`, `lib/`, `utils/`, `components/` (frontend shared UI only).
- If you need something from another module, **stop and ask** — do not reach across boundaries.

---

## 4. AUTONOMY RULES

| Rule | Action |
|------|--------|
| Unclear requirement | **STOP AND ASK** — never assume |
| Missing dependency module | **STOP AND REPORT** — do not stub fake APIs |
| Cross-module change needed | **STOP AND ASK** — propose the change, do not implement silently |
| Security-sensitive logic | Enter **HIGH-ALERT MODE** (see §6) |
| Financial data | Enter **HIGH-ALERT MODE** |
| Any delete operation | Soft delete only — see §7 |
| Breaking API contract | **STOP AND ASK** |

You may proceed autonomously when: requirements are clear, dependencies exist and work, changes stay inside your module, and no high-alert trigger applies.

---

## 5. THE 5-SECTION PROGRESS REPORT FORMAT

After completing **each feature or screen**, post a report using exactly these five sections:

```markdown
## 1. What I Built
[Brief description of the feature/screen and its purpose]

## 2. Files Changed
[List every file created or modified with one-line description]

## 3. How I Tested
[Manual steps, curl commands, or test commands run — include results]

## 4. Security & Scope Checks
[Role guards, medresa_id scoping, Zod validation, soft delete, sensitive fields excluded]

## 5. Blockers / Questions / Next Step
[Anything unclear, cross-module needs, or what you will build next]
```

Do not mark a feature done without sections 3 and 4 filled in honestly.

---

## 6. HIGH-ALERT ZONES (5 ZONES)

When a zone applies, slow down, re-read specs, and complete the checklist before committing.

### Zone 1 — Security & Authentication
**Triggered in:** M01 (entire module); all auth middleware in M02–M10

**Checklist:**
- [ ] Passwords hashed with bcrypt (12 rounds)
- [ ] JWT access token short-lived (15 min); refresh in httpOnly cookie
- [ ] Refresh tokens hashed in DB; rotated on use
- [ ] Reset tokens hashed, 1-hour expiry, single use
- [ ] Role guard on every protected route
- [ ] `medresa_id` from JWT, never from request body
- [ ] No passwords or tokens in logs or API responses

### Zone 2 — Cross-Module Boundaries
**Triggered in:** M04 (needs M03), M05 (needs M04), M10 (reads all modules)

**Checklist:**
- [ ] Dependency module confirmed complete
- [ ] No direct imports across module internals
- [ ] API contracts verified with curl/Postman before UI work
- [ ] Scope documented in progress report §5 if touching shared types

### Zone 3 — Hard Delete (THE RED LINE)
**Triggered in:** Every module, every delete path

**Checklist:**
- [ ] Uses `deleted_at` timestamp only — **never** `prisma.*.delete()`
- [ ] Queries filter `deleted_at: null` by default
- [ ] UI copy says "Deactivate" not "Delete" where appropriate
- [ ] Audit log records soft-delete action

### Zone 4 — Financial Data
**Triggered in:** M08 (fees), M09 (salaries), M10 (financial reports)

**Checklist:**
- [ ] Amounts stored as integer cents (no floats)
- [ ] Medresa scope enforced on every query
- [ ] M09 Super Admin only — never exposed to Medresa Admin or Teacher
- [ ] Transactions use Prisma `$transaction` for multi-table writes
- [ ] Audit log on every payment write
- [ ] Timezone: `Africa/Addis_Ababa` for date boundaries

### Zone 5 — Testing & Documentation
**Triggered in:** Every module, every feature

**Checklist:**
- [ ] Zod validation on all inputs
- [ ] At least one test or documented manual test matrix for the feature
- [ ] API response uses standard `{ success, data, error }` format
- [ ] Module doc or README updated if behavior changed

---

## 7. THE ABSOLUTE RED LINE — NO HARD DELETES

**NEVER** physically delete rows from PostgreSQL for user-facing entities.

```typescript
// ✅ CORRECT
await prisma.student.update({
  where: { id },
  data: { deleted_at: new Date() },
});

// ❌ FORBIDDEN — will cause data loss and audit failure
await prisma.student.delete({ where: { id } });
```

Applies to: users, medresas, teachers, students, courses, fees, salaries, grades, attendance, and all join tables with `deleted_at`.

---

## 8. CODE QUALITY STANDARDS

- **TypeScript strict** — no `any` without documented reason
- **Zod** for every request body and query params
- **Prisma `select`** — whitelist fields in responses; never return `password_hash`
- **Error handling** — use standard API error codes from `docs/api-standards.md`
- **Naming** — match existing module patterns (camelCase TS, snake_case DB via Prisma map)
- **i18n** — all user-visible strings via translation keys (`en`, `am`, `ar`)
- **Comments** — only where logic is non-obvious; no noise comments
- **Tests** — required before marking feature done (Zone 5)

---

## 9. SECURITY QUICK REFERENCE

| Layer | Key rules |
|-------|-----------|
| Network | Ports 22/80/443 only; DB not public; Nginx in front |
| Application | JWT + role guard + medresa scope; Zod on all inputs; rate limits |
| Database | `sefinet_app` / `sefinet_admin` roles; RLS; soft deletes |
| Audit | Append-only audit log; triggers on critical tables |

**Always:**
- Filter `deleted_at: null`
- Scope by `medresa_id` from JWT for tenant data
- Hash passwords and tokens before storage
- Validate file uploads: jpg/png, max 2MB, sanitized filenames

---

## 10. BUILD ORDER

Build modules in dependency order — do not skip tiers:

```
Phase 0: Platform foundation (Docker, Prisma, Express, Vite, i18n, auth baseline)
Tier 1:  M01 → M02 → M03
Tier 2:  M04 → M05
Tier 3:  M06, M07, M08, M09 (can parallelize after M05)
Tier 4:  M10 (after operational modules)
```

See `Sefinet_Implementation_Roadmap.md` for sprint-level detail.

---

## 11. DEFINITION OF DONE (per feature)

A feature is done only when **all** are true:

- [ ] API implemented with Zod validation and standard response envelope
- [ ] Role and medresa-scope authorization enforced and tested
- [ ] UI shipped with loading, error, and empty states
- [ ] Soft delete used (if applicable); no hard deletes
- [ ] Sensitive fields excluded from responses
- [ ] Audit logging on critical writes
- [ ] 5-section progress report posted
- [ ] No linter/type errors in changed files

---

## 12. SYSTEM CONSTANTS

| Constant | Value |
|----------|-------|
| Access token expiry | 15 minutes |
| Refresh token expiry | 7 days |
| Password reset expiry | 1 hour |
| bcrypt rounds | 12 |
| Default timezone | `Africa/Addis_Ababa` |
| API prefix | `/api/v1` |
| Languages | `en`, `am`, `ar` (RTL for `ar`) |
| Currency storage | Integer cents (ETB) |
| Upload max size | 2 MB |
| Upload types | jpg, png |
| Rate limit (global) | 100 req/min per IP |
| Rate limit (auth) | 10 req/min per IP |

---

## 13. STANDARD AGENT PROMPT TEMPLATE

Copy this block when starting any module agent:

```
You are an AI coding agent working on Sefinet Al Neja — a production-grade,
multi-tenant web + PWA platform for 20+ Islamic schools in Harari, Ethiopia.

MANDATORY READING BEFORE ANY CODE:
1. Sefinet-Agent-Rules.md         ← your operating law
2. Sefinet-Master-Project-Spec.md ← full system specification
3. backend/prisma/schema.prisma   ← complete database schema
4. docs/architecture.md, docs/security.md, docs/api-standards.md
5. Your module doc in docs/

CORE RULES:
- STOP AND ASK if anything is unclear
- NEVER hard delete — always soft delete (deleted_at)
- NEVER touch files outside your assigned module folder
- NEVER expose password_hash or sensitive fields in API responses
- ALWAYS validate input with Zod
- ALWAYS filter queries by deleted_at: null
- ALWAYS use medresa_id from JWT (never from request body)
- ALWAYS use Prisma select to whitelist response fields
- ALWAYS write tests before marking a feature done
- ALWAYS post the 5-section progress report after each feature
- Enter HIGH-ALERT MODE for: security, financial data, cross-module work, deletes

After reading all required documents, confirm understanding and ask
any questions before writing a single line of code.
```

Module-specific cards: see `Sefinet-Agent-Prompt-Cards.md`.

---

## 14. HANDOFF CHECKLIST

Before marking your module complete for the next agent:

- [ ] All features in module spec implemented
- [ ] All API endpoints documented (routes file + module doc)
- [ ] Role matrix tested (Super Admin / Medresa Admin / Teacher)
- [ ] No hard deletes anywhere in module
- [ ] Progress reports archived for each feature
- [ ] Known limitations documented in module doc
- [ ] Seed data or test accounts documented if needed
- [ ] Next module's dependency endpoints verified working

---

*Sefinet Al Neja — Agent Operating Manual v1.0*  
*When in doubt: stop, document, ask.*
