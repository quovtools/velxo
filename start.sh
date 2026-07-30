#!/bin/sh
set -e
trap 'kill $(jobs -p) 2>/dev/null || true' EXIT INT TERM

cd /app/backend && node dist/main &
BACKEND_PID=$!

cd /app/frontend && npx next start
wait
