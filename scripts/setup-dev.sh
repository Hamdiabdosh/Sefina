#!/usr/bin/env bash
# Start Sefinet dev stack (Postgres, PgBouncer, API, MailHog) and run first-time DB setup.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running."
  echo "On Arch: sudo ./scripts/install-docker-arch.sh"
  echo "Then: newgrp docker   (or log out and back in)"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose plugin not found."
  echo "On Arch: sudo pacman -S docker-compose"
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit if you need custom secrets."
fi

echo "Starting containers..."
docker compose up -d --build

echo "Waiting for Postgres..."
for _ in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U sefinet_admin -d sefinet_db >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Running migrations..."
docker exec sefinet-backend-dev sh /app/scripts/migrate.sh

if docker exec sefinet-backend-dev npm run db:seed 2>/dev/null; then
  echo "Seed complete (or already seeded)."
else
  echo "Seed skipped or failed — run manually: docker exec sefinet-backend-dev npm run db:seed"
fi

echo ""
docker compose ps
echo ""
echo "Dev stack ready:"
echo "  API:     http://localhost:4000"
echo "  MailHog: http://localhost:8025"
echo "  Frontend: cd frontend && npm install && npm run dev  →  http://localhost:5173"
echo ""
echo "Login: superadmin@sefinet.local / Admin@12345"
