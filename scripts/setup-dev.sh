#!/usr/bin/env bash
# Start Sefinet dev stack and run first-time DB setup + login smoke test.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

POSTGRES_ADMIN_USER="${POSTGRES_ADMIN_USER:-sefinet_admin}"
POSTGRES_DB="${POSTGRES_DB:-sefinet_db}"
API_URL="${API_URL:-http://localhost:4000}"
DEV_LOGIN_EMAIL="${DEV_LOGIN_EMAIL:-sefinaalnejah@gmail.com}"
DEV_LOGIN_PASSWORD="${DEV_LOGIN_PASSWORD:-Admin@12345}"

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
  echo "Created .env from .env.example (dev passwords — change for production)."
fi

# Load .env for compose variable substitution (passwords must match sql/*)
set -a
# shellcheck disable=SC1091
source .env
set +a
POSTGRES_ADMIN_USER="${POSTGRES_ADMIN_USER:-sefinet_admin}"
POSTGRES_DB="${POSTGRES_DB:-sefinet_db}"

echo "Starting containers..."
docker compose up -d --build

echo "Waiting for Postgres..."
ready=0
for _ in $(seq 1 60); do
  if docker compose exec -T postgres \
    pg_isready -U "$POSTGRES_ADMIN_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
if [[ "$ready" -ne 1 ]]; then
  echo "ERROR: Postgres did not become ready in time."
  docker compose ps
  exit 1
fi

echo "Waiting for API..."
api_ready=0
for _ in $(seq 1 90); do
  if curl -sf "${API_URL}/health" >/dev/null 2>&1; then
    api_ready=1
    break
  fi
  sleep 2
done
if [[ "$api_ready" -ne 1 ]]; then
  echo "ERROR: API health check failed at ${API_URL}/health"
  docker logs sefinet-backend-dev --tail 40
  exit 1
fi

echo "Running migrations..."
docker exec sefinet-backend-dev sh /app/scripts/migrate.sh

echo "Seeding Super Admin..."
docker exec sefinet-backend-dev npm run db:seed

echo "Seeding dev dataset (medresas, teachers, students)..."
docker exec sefinet-backend-dev npm run db:seed:dev

echo "Verifying login..."
login_body=$(printf '{"identifier":"%s","password":"%s"}' "$DEV_LOGIN_EMAIL" "$DEV_LOGIN_PASSWORD")
login_response=$(curl -sf -X POST "${API_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "$login_body") || {
  echo "ERROR: login request failed"
  docker logs sefinet-backend-dev --tail 40
  exit 1
}

if ! echo "$login_response" | grep -q '"accessToken"'; then
  echo "ERROR: login did not return an access token."
  echo "Response: $login_response"
  exit 1
fi

echo ""
docker compose ps
echo ""
echo "Phase 0 dev stack ready."
echo "  API:      ${API_URL}"
echo "  Health:   ${API_URL}/health"
echo "  MailHog:  http://localhost:8025"
echo "  Frontend: cd frontend && npm install && npm run dev  →  http://localhost:5173"
echo ""
echo "Login: ${DEV_LOGIN_EMAIL} / ${DEV_LOGIN_PASSWORD}"
echo ""
echo "Re-check anytime: ./scripts/verify-dev.sh"
