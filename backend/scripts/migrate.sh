#!/bin/sh
# Sefinet Al Neja — Apply database schema
# Uses DATABASE_ADMIN_URL (direct Postgres) for full rights

set -e

if [ -n "$DATABASE_ADMIN_URL" ]; then
  export DATABASE_URL="$DATABASE_ADMIN_URL"
fi

if [ -d prisma/migrations ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "Running Prisma migrations..."
  npx prisma migrate deploy
else
  echo "No migration files found — syncing schema with prisma db push..."
  npx prisma db push
fi

echo "Generating Prisma client..."
npx prisma generate

echo "Database schema ready."
