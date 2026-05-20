# Sefinet Al Neja — Harari Medresa Management System

A centralized, multi-tenant web + PWA platform for 20+ Islamic schools in Harari, Ethiopia.

> **Note:** This project was formerly known as HMMS (Harari Medresa Management System).

## Tech Stack

**Frontend:** React (Vite) + TypeScript, TanStack Router, TanStack Query, Shadcn/ui + Tailwind CSS, React Hook Form + Zod, Recharts, jsPDF, SheetJS, Vite PWA Plugin, i18next, Axios

**Backend:** Node.js + Express + TypeScript, JWT, Nodemailer, Multer, Zod, Prisma + PostgreSQL, node-cron

## Project Structure

```
sefina/
├── frontend/          # React + Vite frontend (runs locally in dev)
├── backend/           # Express + TypeScript API
├── sql/               # DB init, RLS policies, PgBouncer userlist
├── scripts/           # setup-dev.sh, verify-dev.sh
├── docs/              # Feature specs and agent guides
├── docker-compose.yml # Dev stack: Postgres, PgBouncer, API, MailHog
├── Makefile           # make dev-up, dev-verify, dev-reset-db
├── .env.example       # Environment template (copy to .env)
└── README.md
```

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended for backend + database)
- [Node.js 20+](https://nodejs.org/) (for the frontend dev server)
- Git

---

## Quick Start (recommended)

**Backend in Docker**, **frontend on your machine**.

### One command (backend + DB + migrate + seed + login check)

From the project root (requires Docker running):

```bash
make dev-up
# or: ./scripts/setup-dev.sh
```

This copies `.env.example` → `.env` if missing, starts Postgres/PgBouncer/API/MailHog, applies the schema, seeds the Super Admin, and verifies login against the API.

Re-check a running stack: `make dev-verify` or `./scripts/verify-dev.sh`.

### Manual steps (if you prefer)

#### 1. Configure environment

```bash
cp .env.example .env
```

Dev passwords in `.env.example` match `docker-compose.yml` and `sql/*`. Change them for production (see [Dev defaults](#dev-defaults)).

#### 2. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

#### 3. Start the backend stack

```bash
docker compose up -d --build
docker compose ps
```

You should see **postgres** (healthy), **pgbouncer**, **backend** (healthy), and **mailhog** running.

#### 4. Apply database schema (first time, or after schema changes)

```bash
docker exec sefinet-backend-dev sh /app/scripts/migrate.sh
```

Uses `DATABASE_ADMIN_URL` (direct Postgres). If `backend/prisma/migrations/` is empty, runs `prisma db push`; otherwise `prisma migrate deploy`.

#### 5. Seed data

Super Admin (required):

```bash
docker exec sefinet-backend-dev npm run db:seed
```

Dev dataset — 5 medresas, 10 teachers, 100 students (optional; also runs on `make dev-up`):

```bash
docker exec sefinet-backend-dev npm run db:seed:dev
./scripts/verify-seed-dev.sh   # or: make dev-verify-seed
```

Credentials: [`docs/seed-dev-credentials.md`](docs/seed-dev-credentials.md). All dev teacher accounts use password `Teacher@12345`.

#### 6. Start the frontend

```bash
cd frontend
npm run dev
```

Open the URL Vite prints (usually **http://localhost:5173**). If that port is busy, Vite picks the next free port (e.g. **5174**).

### 7. Sign in

| Field    | Value                        |
|----------|------------------------------|
| Email    | `sefinaalnejah@gmail.com`   |
| Password | `Admin@12345`                |

You can sign in with **email or phone** as the identifier. After login, Super Admins land on the network dashboard.

> **Dev only:** Change the seeded password after first login in any shared environment.

---

## Daily usage

**Start everything**

```bash
# From project root — backend + database + mail (skip migrate/seed if already set up)
docker compose up -d
make dev-verify   # optional smoke test

# From frontend/
npm run dev
```

**Full reset** (wipes database volume): `make dev-reset-db`

**Re-seed dev data** (stack already up): `make dev-seed` then `make dev-verify-seed`

**Stop everything**

```bash
docker compose down
```

`docker compose down` keeps your database data in the `sefinet-postgres-data` volume. Use `docker compose down -v` only if you intend to wipe the database.

**Apply config changes** (e.g. after editing `docker-compose.yml`):

```bash
docker compose up -d --force-recreate pgbouncer backend
```

PostgreSQL is not recreated, so your data stays intact.

---

## Services & URLs

| Service    | Container               | Host URL                          | Purpose                          |
|------------|-------------------------|-----------------------------------|----------------------------------|
| Frontend   | *(local Vite)*          | http://localhost:5173             | Web UI                           |
| Backend API| `sefinet-backend-dev`   | http://localhost:4000             | REST API (`/api/v1/...`)         |
| PostgreSQL | `sefinet-postgres-dev`  | `localhost:5432`                  | Database (admin / migrations)    |
| PgBouncer  | `sefinet-pgbouncer-dev` | `localhost:6432`                  | Connection pool (app traffic)    |
| MailHog UI | `sefinet-mailhog`       | http://localhost:8025             | Captured dev emails              |

The backend talks to Postgres **through PgBouncer** on port **6432** inside Docker. Prisma migrations and seeding use **direct Postgres** on port **5432**.

---

## Health checks

```bash
# All containers running?
docker compose ps

# API responding? (401 = healthy, no token sent)
curl http://localhost:4000/api/v1/auth/me

# Super Admin exists?
docker exec -i sefinet-postgres-dev psql -U sefinet_admin -d sefinet_db <<'SQL'
SELECT email, status FROM "User";
SQL
```

If a container is **exited** or **unhealthy**:

```bash
docker logs sefinet-backend-dev --tail 50
docker logs sefinet-pgbouncer-dev --tail 30
```

---

## Dev defaults

Used when `.env` does not override them:

| Variable | Default |
|----------|---------|
| `POSTGRES_DB` | `sefinet_db` |
| `POSTGRES_ADMIN_USER` | `sefinet_admin` |
| `POSTGRES_ADMIN_PASSWORD` | `devpassword123` |
| `POSTGRES_APP_USER` | `sefinet_app` |
| `POSTGRES_APP_PASSWORD` | `apppassword123` |
| API port | `4000` |
| Frontend API URL | `http://localhost:4000` (see `frontend/src/lib/axios.ts`) |

---

## Running without Docker (optional)

Use this only if you run Postgres yourself and do not use the Compose stack.

```bash
# Backend
cd backend
npm install
cp ../.env.example ../.env   # set DATABASE_URL and DATABASE_ADMIN_URL
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Point `DATABASE_URL` at PgBouncer (`localhost:6432`) or Postgres (`localhost:5432`) depending on your setup.

---

## Production

Production uses a separate overlay:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

See `docs/Sefinet-Docker-Setup.md` for VPS deployment, secrets, and firewall notes. **Do not** use dev seed credentials in production.

---

## Module build order

| Tier | Module | Dependencies |
|------|--------|-------------|
| 1 | M01 — User & Role Management | None |
| 1 | M02 — Medresa Management | M01 |
| 1 | M03 — Teacher Management | M01, M02 |
| 2 | M04 — Course Management | M01–M03 |
| 2 | M05 — Student Management | M01–M04 |
| 3 | M06 — Attendance Tracking | M01–M05 |
| 3 | M07 — Grades & Results | M01–M05 |
| 3 | M08 — Fee Management | M01–M05 |
| 3 | M09 — Salary Management | M01–M03 |
| 4 | M10 — Reporting & Dashboard | M01–M09 |

Feature details: `docs/features.md`. Agent prompts: `docs/HMMS-Agent-Prompt-Cards.md`.

---

## Roles

| Role | Scope |
|------|-------|
| Super Admin | Full network access |
| Medresa Admin | Own medresa only |
| Teacher | Own courses only |

---

## License

Proprietary — Harari Medresa Network
