#!/usr/bin/env bash
# Remove regenerable build artifacts and deprecated paths. Does not touch .env, uploads, or node_modules.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Cleaning Sefinet dev artifacts..."

rm -rf frontend/dist backend/dist
rm -f frontend/tsconfig.tsbuildinfo
rm -rf backend/.npm-cache
rm -f frontend/vite.config.ts.timestamp-*
rm -rf frontend/landing_page_frontend

find "$ROOT" -maxdepth 3 -name '*.log' -type f -delete 2>/dev/null || true

echo "Done. Optional: rm -rf frontend/node_modules backend/node_modules && npm ci in each app."
