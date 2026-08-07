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

# ── Frontend — start immediately so Fly's health check on :8080 passes ───────
# Next.js serves its own pages right away; API calls gracefully fail until
# the backend finishes warming up (usually < 30s).
echo "[start.sh] Starting Next.js on port 8080..."
cd /app/frontend && npx next start -p 8080
