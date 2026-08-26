#!/bin/sh
set -e

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Seeding database (safe to run repeatedly, upserts only)..."
npx tsx prisma/seed.ts

echo "Starting server..."
exec npx next start -H 0.0.0.0 -p 3000
