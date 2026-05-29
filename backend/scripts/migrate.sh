#!/bin/sh
# Sefinet Al Neja — Apply database schema
# Uses DATABASE_ADMIN_URL (direct Postgres) for full rights

set -e

if [ -n "$DATABASE_ADMIN_URL" ]; then
  export DATABASE_URL="$DATABASE_ADMIN_URL"
fi

w

echo "Generating Prisma client..."
npx prisma generate

echo "Database schema ready."
