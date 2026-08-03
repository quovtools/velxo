#!/bin/sh
# Do NOT use set -e — a backend crash must not kill the Next.js process.
trap 'kill $(jobs -p) 2>/dev/null || true' EXIT INT TERM

#!/bin/sh
# Do NOT use set -e — a backend crash must not kill the Next.js process.
trap 'kill $(jobs -p) 2>/dev/null || true' EXIT INT TERM

# ── Schema migration — apply any pending migrations ──────────────────────────
echo "[start.sh] Applying pending Prisma migrations..."
cd /app/backend && npx prisma migrate deploy --schema ./prisma/schema.prisma 2>&1 || \
  echo "[start.sh] ⚠ prisma migrate deploy failed — continuing anyway"

# ── Backend (auto-restart on crash) ────────────────────────────────────────
start_backend() {
  while true; do
    echo "[start.sh] Starting backend..."
    cd /app/backend && node dist/main
    echo "[start.sh] ⚠ Backend exited (code $?). Restarting in 5s..."
    sleep 5
  done
}
start_backend &

# ── Wait for backend to be ready ───────────────────────────────────────────
echo "[start.sh] Waiting for backend on localhost:3001..."
MAX_WAIT=120
WAITED=0
until wget -q --spider http://localhost:3001/api/v1 2>/dev/null; do
  if [ $WAITED -ge $MAX_WAIT ]; then
    echo "[start.sh] ⚠ Backend not ready after ${MAX_WAIT}s — starting Next.js anyway"
    break
  fi
  sleep 2
  WAITED=$((WAITED + 2))
done
echo "[start.sh] ✓ Backend ready after ${WAITED}s"

# ── Frontend (blocks until container exits) ────────────────────────────────
cd /app/frontend && npx next start -p 8080
