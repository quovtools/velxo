-- ============================================================
-- add_ai_assistant
-- Tables backing the admin AI assistant (chat threads, messages,
-- two-phase confirmation queue) and the public valuation scope.
--
-- This migration is ADDITIVE and IDEMPOTENT — safe to re-run and
-- safe on both fresh and drifted databases.
-- ============================================================

-- ── ai_conversations ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ai_conversations" (
  "id"        TEXT         NOT NULL,
  "ownerKey"  TEXT         NOT NULL,
  "scope"     TEXT         NOT NULL DEFAULT 'admin',
  "title"     TEXT         NOT NULL DEFAULT 'New conversation',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_conversations_ownerKey_scope_updatedAt_idx"
  ON "ai_conversations" ("ownerKey", "scope", "updatedAt");

-- ── ai_messages ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ai_messages" (
  "id"             TEXT         NOT NULL,
  "conversationId" TEXT         NOT NULL,
  "role"           TEXT         NOT NULL,
  "content"        TEXT         NOT NULL,
  "toolCalls"      JSONB,
  "toolCallId"     TEXT,
  "toolName"       TEXT,
  "model"          TEXT,
  "tokensInput"    INTEGER,
  "tokensOutput"   INTEGER,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_messages_conversationId_createdAt_idx"
  ON "ai_messages" ("conversationId", "createdAt");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_messages_conversationId_fkey') THEN
    ALTER TABLE "ai_messages"
      ADD CONSTRAINT "ai_messages_conversationId_fkey"
      FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ── ai_pending_actions ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ai_pending_actions" (
  "id"             TEXT         NOT NULL,
  "conversationId" TEXT         NOT NULL,
  "toolName"       TEXT         NOT NULL,
  "toolCallId"     TEXT,
  "args"           JSONB        NOT NULL,
  "summary"        TEXT         NOT NULL,
  "status"         TEXT         NOT NULL DEFAULT 'PENDING',
  "result"         JSONB,
  "expiresAt"      TIMESTAMP(3) NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_pending_actions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ai_pending_actions" ADD COLUMN IF NOT EXISTS "toolCallId" TEXT;

CREATE INDEX IF NOT EXISTS "ai_pending_actions_conversationId_status_idx"
  ON "ai_pending_actions" ("conversationId", "status");
CREATE INDEX IF NOT EXISTS "ai_pending_actions_expiresAt_idx"
  ON "ai_pending_actions" ("expiresAt");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_pending_actions_conversationId_fkey') THEN
    ALTER TABLE "ai_pending_actions"
      ADD CONSTRAINT "ai_pending_actions_conversationId_fkey"
      FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ── valuation_feedback ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "valuation_feedback" (
  "id"             TEXT         NOT NULL,
  "requestId"      TEXT         NOT NULL,
  "gameName"       TEXT         NOT NULL,
  "verdict"        TEXT         NOT NULL,
  "estimatedValue" DECIMAL(14,2),
  "currency"       TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "valuation_feedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "valuation_feedback_requestId_key"
  ON "valuation_feedback" ("requestId");
CREATE INDEX IF NOT EXISTS "valuation_feedback_gameName_createdAt_idx"
  ON "valuation_feedback" ("gameName", "createdAt");
