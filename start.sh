#!/bin/sh
set -e
trap 'kill $(jobs -p) 2>/dev/null || true' EXIT INT TERM

# Start the backend in the background
cd /app/backend && node dist/main &
BACKEND_PID=$!

# Wait for the backend to be ready before starting Next.js.
# The backend runs prisma db push at startup which can take 10-30s.
echo "[start.sh] Waiting for backend on localhost:3001..."
MAX_WAIT=120
WAITED=0
until wget -q --spider http://localhost:3001/api/v1 2>/dev/null; do
  if [ $WAITED -ge $MAX_WAIT ]; then
    echo "[start.sh] ⚠ Backend did not become ready within ${MAX_WAIT}s — starting Next.js anyway"
    break
  fi
  sleep 2
  WAITED=$((WAITED + 2))
done
echo "[start.sh] ✓ Backend ready after ${WAITED}s"

# Start the Next.js frontend (this blocks until the container exits)
cd /app/frontend && npx next start -p 8080
wait
