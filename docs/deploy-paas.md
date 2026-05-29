# Safe deployment test (Vercel + Render / Railway)

This guide deploys a **staging copy** in the cloud. Your local project stays unchanged if you follow the safety steps below.

## What will NOT change

| Stays the same | Why |
|----------------|-----|
| Local `docker compose` / `make dev-up` | We only **add** files; compose is untouched |
| Your `.env` on disk | Never committed; you create **new** env vars in Render/Vercel dashboards |
| Postgres data in Docker volumes | Cloud DB is separate |
| `main` branch (until you merge) | Work on a branch first |

## What we added (safe, additive)

- `frontend/vercel.json` — SPA routing for client-side routes
- `render.yaml` — optional Render blueprint (backend + Postgres)
- `.env.paas.example` — template for cloud env vars (copy values into dashboards)
- `scripts/paas-preflight.sh` — checks before you deploy
- Backend `npm run start:paas` — migrate + start (for Render/Railway)
- Cross-site refresh cookies when `FRONTEND_URL` is not localhost (Vercel + API on another host)

---

## Step 0 — Protect your work (do this first)

```bash
cd /path/to/Sefina

# 1) Commit or stash current work so nothing is lost
git status
git add -A && git commit -m "WIP: save before paas deploy docs"   # or: git stash -u

# 2) Branch for deployment experiments (revert = delete branch)
git checkout -b deploy/paas-staging

# 3) Optional: push branch to GitHub as backup
git push -u origin deploy/paas-staging
```

To undo cloud experiments only: delete Render/Vercel services in their dashboards.  
To undo code: `git checkout main` and `git branch -D deploy/paas-staging`.

---

## Architecture (staging)

```
Browser
   │
   ├─► Vercel  →  static SPA (frontend/dist)
   │              VITE_API_URL → Render API URL
   │
   └─► Render  →  Express API (:4000)
                  └─► Render PostgreSQL (new empty DB)
```

PgBouncer is **not** used on PaaS for the first test — set `DATABASE_URL` to the provider’s Postgres URL.

---

## Step 1 — Render (backend + database)

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** (if repo has `render.yaml`)  
   **or** create manually:
   - **PostgreSQL** → note **Internal Database URL**
   - **Web Service** → connect repo, branch `deploy/paas-staging`
2. Web service settings:

   | Setting | Value |
   |---------|--------|
   | Root directory | `backend` |
   | Build command | `npm ci && npm run build && npx prisma generate` |
   | Start command | `npm run start:paas` |
   | Health check path | `/health` |

3. Environment variables (see `.env.paas.example`):

   - `DATABASE_URL` — Postgres URL from Render
   - `DATABASE_ADMIN_URL` — same as `DATABASE_URL` for first deploy
   - `NODE_ENV` = `production`
   - `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — generate new (64-char hex each)
   - `FRONTEND_URL` — fill after Vercel deploy, e.g. `https://your-app.vercel.app`
   - `SMTP_*` — optional for password-reset email test

4. After first deploy, **one-time** in Render shell or local against cloud DB:

   ```bash
   npm run db:seed
   ```

   Use **only** `db:seed` (Super Admin). Do **not** run `db:seed:dev` on a public URL.

5. Smoke test:

   ```bash
   curl https://YOUR-API.onrender.com/health
   curl https://YOUR-API.onrender.com/api/v1/public/medresas
   ```

---

## Step 2 — Vercel (frontend)

1. [Vercel](https://vercel.com) → Import repo → branch `deploy/paas-staging`
2. Project settings:

   | Setting | Value |
   |---------|--------|
   | Framework | Vite |
   | Root directory | `frontend` |
   | Build command | `npm run build` |
   | Output directory | `dist` |

3. Environment variables (Production + Preview):

   | Variable | Value |
   |----------|--------|
   | `VITE_API_URL` | `https://YOUR-API.onrender.com` (no trailing slash) |
   | `VITE_GOOGLE_CLIENT_ID` | optional, same as backend `GOOGLE_CLIENT_ID` |

4. Deploy → copy the Vercel URL → set Render `FRONTEND_URL` to that exact URL → **redeploy** backend (CORS).

5. Browser test: open Vercel URL → marketing page → **Staff sign in** → login with seeded Super Admin (change password from dev default in staging).

---

## Step 3 — Google OAuth (optional)

In Google Cloud Console, add **Authorized JavaScript origins**:

- `https://your-app.vercel.app`
- `http://localhost:5173` (keep for local dev)

---

## Railway instead of Render

Same idea:

- Postgres plugin → `DATABASE_URL`
- Service root `backend`, build/start as above
- Env vars from `.env.paas.example`

No `railway.toml` is required; use the dashboard.

---

## Known limits on first PaaS test

| Feature | Staging on Render/Vercel |
|---------|---------------------------|
| Login / refresh / roles | Should work with `FRONTEND_URL` + cross-site cookies |
| Teacher/student **photos** | Ephemeral disk — may be lost on redeploy; use VPS/Docker prod for real uploads |
| Email | Needs real SMTP (not MailHog) |
| Dev seed data | Do not use on public staging |
| Automated CI tests | Not required for this smoke test |

---

## Local dev still works

```bash
make dev-up          # unchanged
cd frontend && npm run dev
```

PaaS env vars live only in Render/Vercel — not in your repo `.env` unless you choose to add them.

---

## Rollback checklist

1. Delete Vercel project (or pause deployments).
2. Delete Render web service + Postgres (staging).
3. `git checkout main` locally.
4. Run `docker compose up -d` — your old stack is back.

---

## Preflight script

```bash
./scripts/paas-preflight.sh
```

Checks build, env template, and that sensitive files are not about to be committed.
