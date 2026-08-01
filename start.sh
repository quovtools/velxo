#!/bin/sh
# Do NOT use set -e here — if the backend crashes we want Next.js to stay up
# so the frontend remains accessible and the backend can be restarted.
trap 'kill $(jobs -p) 2>/dev/null || true' EXIT INT TERM

# Start the backend in the background. If it crashes, restart it automatically.
start_backend() {
  while true; do
    echo "[start.sh] Starting backend..."
    cd /app/backend && node dist/main
    EXIT_CODE=$?
    echo "[start.sh] ⚠ Backend exited with code ${EXIT_CODE}. Restarting in 5s..."
    sleep 5
  done
}
start_backend &

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
