#!/bin/sh
# Do NOT use set -e — a backend crash must not kill the Next.js process.
trap 'kill $(jobs -p) 2>/dev/null || true' EXIT INT TERM

#!/bin/sh
# Do NOT use set -e — a backend crash must not kill the Next.js process.
trap 'kill $(jobs -p) 2>/dev/null || true' EXIT INT TERM

# ── Schema migration — only when schema has changed ─────────────────────────
# Computes a hash of schema.prisma and skips db push if unchanged since last
# run. This avoids waking NeonDB compute on every container restart.
SCHEMA_FILE="/app/backend/prisma/schema.prisma"
HASH_FILE="/tmp/.prisma_schema_hash"
CURRENT_HASH=$(md5sum "$SCHEMA_FILE" 2>/dev/null | awk '{print $1}')
STORED_HASH=$(cat "$HASH_FILE" 2>/dev/null || echo "")

if [ "$CURRENT_HASH" != "$STORED_HASH" ]; then
  echo "[start.sh] Schema changed — running prisma db push..."
  cd /app/backend && npx prisma db push --skip-generate --accept-data-loss 2>&1 && \
    echo "$CURRENT_HASH" > "$HASH_FILE" || \
    echo "[start.sh] ⚠ prisma db push failed — continuing anyway"
else
  echo "[start.sh] Schema unchanged — skipping prisma db push"
fi

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
