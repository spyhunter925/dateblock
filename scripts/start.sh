#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding admin user if needed..."
npm run db:seed

echo "Starting application..."
exec node server.js
