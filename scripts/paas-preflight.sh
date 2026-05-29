#!/usr/bin/env bash
# Read-only checks before PaaS deploy — does not modify the project.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== Sefina PaaS preflight =="
echo "Project root: $ROOT"
echo ""

fail=0

warn() { echo "WARN: $*"; }
ok() { echo "OK:   $*"; }
bad() { echo "FAIL: $*"; fail=1; }

# Git safety
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  branch="$(git branch --show-current)"
  ok "On git branch: $branch"
  if [[ "$branch" == "main" ]]; then
    warn "You are on main — consider: git checkout -b deploy/paas-staging"
  fi
  if [[ -n "$(git status --porcelain)" ]]; then
    warn "Uncommitted changes — commit or stash before deploying"
  fi
else
  warn "Not a git repo"
fi

# Required new files
for f in docs/deploy-paas.md frontend/vercel.json .env.paas.example render.yaml; do
  if [[ -f "$f" ]]; then ok "Found $f"; else bad "Missing $f"; fi
done

# .env must not be committed
if git check-ignore -q .env 2>/dev/null || ! [[ -f .env ]]; then
  ok ".env not tracked or absent from commit risk"
else
  if git ls-files --error-unmatch .env >/dev/null 2>&1; then
    bad ".env is tracked by git — remove from index before push"
  fi
fi

# Backend build
echo ""
echo "-- Backend build --"
if (cd backend && npm run build >/dev/null 2>&1); then
  ok "backend npm run build"
else
  bad "backend build failed — fix before deploy"
fi

# Frontend build (needs no VITE_API_URL for compile)
echo ""
echo "-- Frontend build --"
if (cd frontend && npm run build >/dev/null 2>&1); then
  ok "frontend npm run build"
else
  bad "frontend build failed — fix before deploy"
fi

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "Preflight passed. Next: read docs/deploy-paas.md"
  exit 0
fi
echo "Preflight failed — fix issues above."
exit 1
