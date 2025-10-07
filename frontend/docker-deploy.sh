#!/bin/sh
set -e

# Run Prisma migrations
npx prisma migrate deploy


# Run seed script using Prisma's seed command
npx prisma db seed || true

# Start Next.js app
npm run dev