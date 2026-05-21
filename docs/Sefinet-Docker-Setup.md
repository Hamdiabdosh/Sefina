# Sefinet Al Neja — Docker Setup Agent Prompt
## PostgreSQL + PgBouncer + Backend (Dev + Production)
**Project:** Sefinet Al Neja — Harari Medresa Management System
**Version:** 1.0

---

## CONTEXT

You are setting up the Docker infrastructure for **Sefinet Al Neja**, a multi-tenant medresa management platform built with:

- **Backend:** Node.js + Express + TypeScript (runs on port 4000)
- **Database:** PostgreSQL 16
- **Connection pool:** PgBouncer (transaction mode)
- **Frontend:** React + Vite — runs separately, NOT dockerized

The frontend runs on its own (`npm run dev` on port 5173 in dev, built static files served by Nginx in production). Docker only manages the backend services.

---

## STEP 1 — READ FIRST

Before writing any file read:
- [ ] `Sefinet-Agent-Rules.md`
- [ ] `docs/architecture.md` — understand the full system layout
- [ ] `backend/.env.example` — understand what env vars exist
- [ ] `backend/prisma/schema.prisma` — understand the DB schema

Confirm you have read all of the above before starting.

---

## STEP 2 — UNDERSTAND THE TARGET STRUCTURE

You will create these files:

```
sefinet/
├── docker-compose.yml          ← DEV: all services for local development
├── docker-compose.prod.yml     ← PROD: production overrides
├── .env.example                ← Template with all required env vars
├── .dockerignore               ← Files to exclude from Docker builds
├── backend/
│   └── Dockerfile              ← Backend container definition
└── docs/
    └── Sefinet-Docker-Setup.md   ← Docker and deployment guide (this file)
```

Do NOT create a Dockerfile for the frontend — it runs outside Docker.

---

## PART 1 — DEVELOPMENT SETUP

### File 1: `backend/Dockerfile`

```dockerfile
# Multi-stage build — dev stage used by docker-compose.yml
# Production stage used by docker-compose.prod.yml

# ── STAGE 1: Dependencies ──────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# ── STAGE 2: Development ───────────────────────────────
FROM node:20-alpine AS dev
WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose backend port
EXPOSE 4000

# Development: run with ts-node-dev for hot reload
CMD ["npm", "run", "dev"]

# ── STAGE 3: Builder ───────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client and compile TypeScript
RUN npx prisma generate && npm run build

# ── STAGE 4: Production ────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled output and Prisma client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

# Create uploads directory
RUN mkdir -p /app/uploads/teachers /app/uploads/students

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 4000

# Production: run compiled JS
CMD ["node", "dist/server.js"]
```

**Notes for agent:**
- The `dev` stage uses hot reload — source code is mounted as a volume
- The `production` stage compiles TypeScript and runs the compiled output
- Non-root user in production is required for security
- Uploads directory created inside container — mount as volume in production

---

### File 2: `docker-compose.yml` (Development)

```yaml
# Sefinet Al Neja — Development Docker Compose
# Services: PostgreSQL + PgBouncer + Backend (hot reload)
# Frontend runs separately: cd frontend && npm run dev

name: sefinet-dev

services:

  # ── PostgreSQL 16 ───────────────────────────────────
  postgres:
    image: postgres:16-alpine
    container_name: sefinet-postgres-dev
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-sefinet_db}
      POSTGRES_USER: ${POSTGRES_ADMIN_USER:-sefinet_admin}
      POSTGRES_PASSWORD: ${POSTGRES_ADMIN_PASSWORD:-devpassword123}
    ports:
      - "5432:5432"          # Exposed for local tools (TablePlus, DBeaver)
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql/init.sql:/docker-entrypoint-initdb.d/01-init.sql:ro
      - ./sql/rls-policies.sql:/docker-entrypoint-initdb.d/02-rls.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_ADMIN_USER:-sefinet_admin} -d ${POSTGRES_DB:-sefinet_db}"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s
    networks:
      - sefinet-network

  # ── PgBouncer ───────────────────────────────────────
  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    container_name: sefinet-pgbouncer-dev
    restart: unless-stopped
    environment:
      DATABASES_HOST: postgres
      DATABASES_PORT: 5432
      DATABASES_DBNAME: ${POSTGRES_DB:-sefinet_db}
      PGBOUNCER_POOL_MODE: transaction
      PGBOUNCER_MAX_CLIENT_CONN: 100
      PGBOUNCER_DEFAULT_POOL_SIZE: 20
      PGBOUNCER_AUTH_TYPE: scram-sha-256
      # App user (limited rights)
      PGBOUNCER_AUTH_USER: ${POSTGRES_APP_USER:-sefinet_app}
      # Admin user for migrations
      DATABASES_USER: ${POSTGRES_ADMIN_USER:-sefinet_admin}
      DATABASES_PASSWORD: ${POSTGRES_ADMIN_PASSWORD:-devpassword123}
    ports:
      - "6432:5432"          # PgBouncer exposed on 6432
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - sefinet-network

  # ── Backend (hot reload) ────────────────────────────
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: dev              # Uses the dev stage
    container_name: sefinet-backend-dev
    restart: unless-stopped
    environment:
      NODE_ENV: development
      PORT: 4000
      # App connects through PgBouncer
      DATABASE_URL: postgresql://${POSTGRES_APP_USER:-sefinet_app}:${POSTGRES_APP_PASSWORD:-apppassword123}@pgbouncer:5432/${POSTGRES_DB:-sefinet_db}
      # Admin URL for Prisma migrations (connects directly to Postgres)
      DATABASE_ADMIN_URL: postgresql://${POSTGRES_ADMIN_USER:-sefinet_admin}:${POSTGRES_ADMIN_PASSWORD:-devpassword123}@postgres:5432/${POSTGRES_DB:-sefinet_db}
      # JWT
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET:-dev-access-secret-change-in-production}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:-dev-refresh-secret-change-in-production}
      JWT_ACCESS_EXPIRY: 15m
      JWT_REFRESH_EXPIRY: 7d
      # Email
      SMTP_HOST: ${SMTP_HOST:-mailhog}
      SMTP_PORT: ${SMTP_PORT:-1025}
      SMTP_USER: ${SMTP_USER:-}
      SMTP_PASS: ${SMTP_PASS:-}
      SMTP_FROM: "Sefinet Al Neja <noreply@sefinet.et>"
      # App
      FRONTEND_URL: http://localhost:5173
      RESET_TOKEN_EXPIRY_HOURS: 1
      UPLOAD_DIR: /app/uploads
      TZ: Africa/Addis_Ababa
    ports:
      - "4000:4000"
    volumes:
      # Hot reload: mount source code
      - ./backend/src:/app/src
      - ./backend/prisma:/app/prisma
      # Persist uploads between restarts
      - uploads_data:/app/uploads
      # Exclude node_modules from host mount
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - sefinet-network

  # ── MailHog (dev email catcher) ─────────────────────
  mailhog:
    image: mailhog/mailhog:latest
    container_name: sefinet-mailhog
    restart: unless-stopped
    ports:
      - "1025:1025"           # SMTP port
      - "8025:8025"           # Web UI: http://localhost:8025
    networks:
      - sefinet-network

volumes:
  postgres_data:
    name: sefinet-postgres-data
  uploads_data:
    name: sefinet-uploads-data

networks:
  sefinet-network:
    name: sefinet-network
    driver: bridge
```

**What MailHog does:** Catches all emails sent by the backend (password reset links, etc.) in development. View caught emails at http://localhost:8025. No real emails are sent.

---

### File 3: `sql/init.sql` (Database initialization)

```sql
-- Sefinet Al Neja — Database Initialization
-- Runs once when PostgreSQL container is first created
-- Creates the app user with limited rights

-- Create app user (used by Prisma in production)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'sefinet_app') THEN
    CREATE ROLE sefinet_app WITH LOGIN PASSWORD 'apppassword123';
  END IF;
END
$$;

-- Grant connection rights
GRANT CONNECT ON DATABASE sefinet_db TO sefinet_app;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO sefinet_app;

-- Grant table-level rights (SELECT, INSERT, UPDATE — no DELETE)
-- Hard delete is forbidden in Sefinet Al Neja
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO sefinet_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sefinet_app;

-- Ensure future tables also grant rights to app user
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO sefinet_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO sefinet_app;

-- AuditLog: app user can only INSERT (append-only)
-- This is enforced after Prisma creates the table via migration
-- See rls-policies.sql for the restriction
```

---

### File 4: `.env.example`

```env
# ═══════════════════════════════════════════════════
# Sefinet Al Neja — Environment Variables
# Copy this file to .env and fill in your values
# NEVER commit .env to version control
# ═══════════════════════════════════════════════════

# ── PostgreSQL ──────────────────────────────────────
POSTGRES_DB=sefinet_db
POSTGRES_ADMIN_USER=sefinet_admin
POSTGRES_ADMIN_PASSWORD=change_this_strong_password
POSTGRES_APP_USER=sefinet_app
POSTGRES_APP_PASSWORD=change_this_app_password

# ── Backend Database URLs ───────────────────────────
# App uses PgBouncer (port 6432 in dev, 5432 in prod via internal network)
DATABASE_URL=postgresql://sefinet_app:change_this_app_password@pgbouncer:5432/sefinet_db
# Admin URL for Prisma migrations (direct to Postgres)
DATABASE_ADMIN_URL=postgresql://sefinet_admin:change_this_strong_password@postgres:5432/sefinet_db

# ── JWT ─────────────────────────────────────────────
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=generate_a_256_bit_secret_here
JWT_REFRESH_SECRET=generate_a_different_256_bit_secret_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# ── Email (SMTP) ────────────────────────────────────
# Dev: leave as mailhog defaults (no real email sent)
# Prod: use your real SMTP provider
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Sefinet Al Neja <noreply@sefinet.et>

# ── Application ──────────────────────────────────────
FRONTEND_URL=http://localhost:5173
RESET_TOKEN_EXPIRY_HOURS=1
UPLOAD_DIR=/app/uploads
TZ=Africa/Addis_Ababa
NODE_ENV=development

# ── Rate Limiting ────────────────────────────────────
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10
```

---

### File 5: `.dockerignore`

```
# Sefinet Al Neja — Docker ignore file
node_modules
npm-debug.log
.env
.env.*
!.env.example
dist
build
.git
.gitignore
README.md
*.md
coverage
.nyc_output
.DS_Store
Thumbs.db
uploads
*.log
```

---

## PART 2 — PRODUCTION SETUP

### File 6: `docker-compose.prod.yml`

```yaml
# Sefinet Al Neja — Production Docker Compose
# Usage: docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
# Overrides the dev compose for production deployment

name: sefinet-prod

services:

  postgres:
    container_name: sefinet-postgres
    ports: []                  # Do NOT expose PostgreSQL port in production
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_ADMIN_USER}
      POSTGRES_PASSWORD: ${POSTGRES_ADMIN_PASSWORD}
    volumes:
      - /var/sefinet/postgres:/var/lib/postgresql/data
      - ./sql/init.sql:/docker-entrypoint-initdb.d/01-init.sql:ro
      - ./sql/rls-policies.sql:/docker-entrypoint-initdb.d/02-rls.sql:ro
    restart: always

  pgbouncer:
    container_name: sefinet-pgbouncer
    ports: []                  # Do NOT expose PgBouncer port in production
    restart: always

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production       # Uses the production stage
    container_name: sefinet-backend
    restart: always
    environment:
      NODE_ENV: production
      PORT: 4000
      DATABASE_URL: postgresql://${POSTGRES_APP_USER}:${POSTGRES_APP_PASSWORD}@pgbouncer:5432/${POSTGRES_DB}
      DATABASE_ADMIN_URL: postgresql://${POSTGRES_ADMIN_USER}:${POSTGRES_ADMIN_PASSWORD}@postgres:5432/${POSTGRES_DB}
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      JWT_ACCESS_EXPIRY: 15m
      JWT_REFRESH_EXPIRY: 7d
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      SMTP_FROM: ${SMTP_FROM}
      FRONTEND_URL: ${FRONTEND_URL}
      RESET_TOKEN_EXPIRY_HOURS: 1
      UPLOAD_DIR: /app/uploads
      TZ: Africa/Addis_Ababa
    volumes:
      # No source code mount in production
      - /var/sefinet/uploads:/app/uploads
    ports:
      - "127.0.0.1:4000:4000"  # Only accessible from localhost (Nginx proxies)

  # No MailHog in production
  mailhog:
    profiles: ["dev-only"]     # Never starts in production
```

---

## PART 3 — AGENT SETUP TASKS

### Task 1: Verify package.json scripts

Check `backend/package.json`. Ensure these scripts exist:

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.ts",
    "db:migrate": "prisma migrate deploy",
    "db:migrate:dev": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "ts-node prisma/seed.ts",
    "test": "vitest run"
  }
}
```

If `ts-node-dev` is not installed, add it:
```bash
npm install -D ts-node-dev
```

---

### Task 2: Create a Prisma migration script

Create `backend/scripts/migrate.sh`:

```bash
#!/bin/sh
# Sefinet Al Neja — Run Prisma migrations
# Uses DATABASE_ADMIN_URL for full migration rights

echo "Running Prisma migrations..."
DATABASE_URL=$DATABASE_ADMIN_URL npx prisma migrate deploy

echo "Generating Prisma client..."
npx prisma generate

echo "Migrations complete."
```

Make it executable: `chmod +x backend/scripts/migrate.sh`

The backend Dockerfile runs this before starting in production.
Update the production CMD:

```dockerfile
# In the production stage CMD:
CMD ["sh", "-c", "sh /app/scripts/migrate.sh && node dist/server.js"]
```

---

### Task 3: Create `sql/` directory and placeholder files

If `sql/init.sql` and `sql/rls-policies.sql` don't exist yet:

```bash
mkdir -p sql
touch sql/init.sql
touch sql/rls-policies.sql
```

Add the `init.sql` content from Part 1 above.
`rls-policies.sql` content comes from `docs/security.md` — copy it there.

---

### Task 4: Update backend `src/server.ts`

Ensure the server reads from environment variables correctly:

```typescript
// Verify these are present in server.ts:
const PORT = process.env.PORT || 4000;
const DATABASE_URL = process.env.DATABASE_URL; // used by Prisma automatically
```

Prisma reads `DATABASE_URL` from environment automatically — no code change needed for Prisma. Just ensure the env var is set correctly in docker-compose.

---

### Task 5: Add `.env` to `.gitignore`

Check `.gitignore` at the root. Ensure it contains:

```
.env
.env.local
.env.production
!.env.example
```

---

## PART 4 — VPS PRODUCTION DEPLOYMENT GUIDE

### Prerequisites on the VPS (Ubuntu 22.04)

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# 3. Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# 4. Verify
docker --version
docker compose version

# 5. Install Nginx
sudo apt install nginx -y

# 6. Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# 7. Install Node.js 20 (for running frontend build)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y
```

---

### Step 1: Clone and configure

```bash
# Clone the repository
git clone https://github.com/your-org/sefinet-al-neja.git /var/www/sefinet
cd /var/www/sefinet

# Copy and fill environment variables
cp .env.example .env
nano .env
# Fill in: POSTGRES passwords, JWT secrets, SMTP settings, FRONTEND_URL
```

**Generate strong secrets:**

```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Run twice — once for JWT_ACCESS_SECRET, once for JWT_REFRESH_SECRET
```

---

### Step 2: Create upload and data directories

```bash
sudo mkdir -p /var/sefinet/postgres
sudo mkdir -p /var/sefinet/uploads/teachers
sudo mkdir -p /var/sefinet/uploads/students
sudo chown -R 1001:1001 /var/sefinet/uploads  # Match the nodejs user in container
```

---

### Step 3: Start Docker services

```bash
cd /var/www/sefinet

# Build and start all production services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Verify all containers are running
docker compose ps

# Check backend logs
docker logs sefinet-backend --tail 50

# Check database logs
docker logs sefinet-postgres --tail 20
```

---

### Step 4: Run database migrations

```bash
# Migrations run automatically on backend start (via migrate.sh)
# But you can also run manually:
docker exec sefinet-backend sh /app/scripts/migrate.sh

# Verify migrations ran
docker exec sefinet-postgres psql -U sefinet_admin -d sefinet_db -c "\dt"
```

---

### Step 5: Build and deploy frontend

```bash
cd /var/www/sefinet/frontend

# Install dependencies
npm ci

# Build for production
VITE_API_URL=https://your-domain.com npm run build

# Copy to Nginx directory
sudo mkdir -p /var/www/html/sefinet
sudo cp -r dist/* /var/www/html/sefinet/
```

---

### Step 6: Configure Nginx

Create `/etc/nginx/sites-available/sefinet`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL (Certbot will fill these in)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Frontend (React PWA)
    root /var/www/html/sefinet;
    index index.html;

    # API proxy → Docker backend
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # File uploads proxy
    location /api/v1/files/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 5M;
    }

    # React PWA — all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml application/xml+rss text/javascript;
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/sefinet /etc/nginx/sites-enabled/
sudo nginx -t  # Test config
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal (certbot sets this up automatically)
sudo certbot renew --dry-run
```

---

### Step 7: Firewall setup

```bash
# UFW firewall rules
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw deny 5432      # Block PostgreSQL from public internet
sudo ufw deny 6432      # Block PgBouncer from public internet
sudo ufw deny 4000      # Block backend from public internet (Nginx only)
sudo ufw enable

# Verify
sudo ufw status
```

---

### Step 8: Useful commands for ongoing operations

```bash
# View logs
docker logs sefinet-backend -f          # Backend logs (live)
docker logs sefinet-postgres -f         # Postgres logs
docker logs sefinet-pgbouncer -f        # PgBouncer logs

# Restart services
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend

# Pull updates and redeploy
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build backend

# Run migrations after update
docker exec sefinet-backend sh /app/scripts/migrate.sh

# Access database directly (admin)
docker exec -it sefinet-postgres psql -U sefinet_admin -d sefinet_db

# Check container health
docker compose ps

# View disk usage
docker system df

# Clean unused images (after deploys)
docker image prune -f
```

---

## PART 5 — DEVELOPMENT DAILY WORKFLOW

Once Docker is set up, this is the daily workflow:

```bash
# Terminal 1 — Start backend services
docker compose up

# Terminal 2 — Start frontend (separate, not dockerized)
cd frontend && npm run dev

# View caught emails (password resets etc.)
open http://localhost:8025

# View API
open http://localhost:4000/api/v1

# View frontend
open http://localhost:5173
```

### First-time setup after cloning

```bash
# 1. Copy env file
cp .env.example .env

# 2. Start services
docker compose up -d

# 3. Wait for PostgreSQL to be healthy (~10 seconds)
docker compose ps

# 4. Run migrations
docker exec sefinet-backend-dev sh /app/scripts/migrate.sh

# 5. Seed super admin (if seed script exists)
docker exec sefinet-backend-dev npm run db:seed

# 6. Start frontend separately
cd frontend && npm install && npm run dev
```

---

## DEFINITION OF DONE

Docker setup is complete when ALL of the following are true:

- [ ] `backend/Dockerfile` builds without errors (dev and prod stages)
- [ ] `docker compose up` starts all 4 services (postgres, pgbouncer, backend, mailhog)
- [ ] PostgreSQL healthcheck passes
- [ ] Backend connects to database through PgBouncer
- [ ] `GET http://localhost:4000/api/v1/auth/me` returns 401 (not a connection error)
- [ ] Prisma migrations run successfully via `migrate.sh`
- [ ] MailHog accessible at `http://localhost:8025`
- [ ] Frontend running separately at `http://localhost:5173` can reach backend at `:4000`
- [ ] `.env.example` documents every required variable
- [ ] `.dockerignore` excludes node_modules and .env files
- [ ] `docker-compose.prod.yml` does NOT expose DB or PgBouncer ports
- [ ] Production Nginx config tested with `nginx -t`
- [ ] VPS firewall blocks ports 5432, 6432, 4000 from public internet

---

## REPORT FORMAT

After completing Docker setup, report:

```
## ✅ Docker Setup Complete

Services running:
  postgres   ← healthy, port 5432 (dev only)
  pgbouncer  ← healthy, port 6432 (dev only)
  backend    ← healthy, port 4000
  mailhog    ← healthy, ports 1025 + 8025

Verified:
  - Backend responds at http://localhost:4000/api/v1/auth/me → 401 ✅
  - Migrations run successfully ✅
  - MailHog catches emails at http://localhost:8025 ✅
  - .env.example complete ✅

Files created:
  - backend/Dockerfile
  - docker-compose.yml
  - docker-compose.prod.yml
  - .env.example
  - .dockerignore
  - sql/init.sql
  - backend/scripts/migrate.sh

Issues found (if any):
  - [list anything that needed a workaround]
```

---

*Sefinet Al Neja — Docker Setup Prompt v1.0*
*Project formerly known as HMMS*
*Dev: PostgreSQL + PgBouncer + Backend + MailHog*
*Production: Same stack, no exposed ports, Nginx in front*
