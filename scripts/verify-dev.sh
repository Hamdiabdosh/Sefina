#!/usr/bin/env bash
# Smoke-test a running dev stack (health + login). Does not start containers.
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
DEV_LOGIN_EMAIL="${DEV_LOGIN_EMAIL:-sefinaalnejah@gmail.com}"
DEV_LOGIN_PASSWORD="${DEV_LOGIN_PASSWORD:-Admin@12345}"

echo "Checking ${API_URL}/health ..."
curl -sf "${API_URL}/health" | grep -q '"status":"ok"' || {
  echo "ERROR: health check failed"
  exit 1
}
echo "  OK"

echo "Checking login ..."
login_body=$(printf '{"identifier":"%s","password":"%s"}' "$DEV_LOGIN_EMAIL" "$DEV_LOGIN_PASSWORD")
login_response=$(curl -sf -X POST "${API_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "$login_body") || {
  echo "ERROR: login request failed (is the stack up? run ./scripts/setup-dev.sh)"
  exit 1
}

echo "$login_response" | grep -q '"accessToken"' || {
  echo "ERROR: login did not return an access token"
  echo "Response: $login_response"
  exit 1
}
echo "  OK"

echo "Dev stack verification passed."
