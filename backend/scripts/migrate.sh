#!/bin/sh
# Sefinet Al Neja — Run Prisma migrations
# Uses DATABASE_ADMIN_URL for full migration rights

set -e

echo "Running Prisma migrations..."
if [ -n "$DATABASE_ADMIN_URL" ]; then
  DATABASE_URL="$DATABASE_ADMIN_URL" npx prisma migrate deploy
else
  npx prisma migrate deploy
fi

echo "Generating Prisma client..."
npx prisma generate

echo "Migrations complete."
