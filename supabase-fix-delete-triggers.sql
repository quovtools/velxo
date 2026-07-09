-- =============================================================================
-- FIX: "The column `new` does not exist in the current database"
-- =============================================================================
-- Symptom: admin actions that DELETE a row (e.g. delete listing) fail with a
-- Prisma error saying column `new` does not exist.
--
-- Cause: a trigger function that references NEW (such as update_updated_at,
-- which sets NEW."updatedAt") is firing during a DELETE. During a DELETE there
-- is no NEW record, so Postgres raises: column "new" does not exist.
--
-- This script:
--   1. Redefines update_updated_at() so it is DELETE-safe.
--   2. Recreates every *_updated_at trigger as BEFORE UPDATE only, dropping any
--      copy that was mistakenly created for INSERT/DELETE events.
--   3. (Diagnostic) Lists any remaining triggers so you can spot other culprits.
--
-- Safe to run multiple times. Run it in the Supabase SQL Editor.
-- =============================================================================

-- 1) Make the shared trigger function DELETE-safe -----------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Recreate every updated_at trigger as BEFORE UPDATE only ------------------
-- Drops any existing trigger with the same name (regardless of which events it
-- was created for) and recreates it correctly.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'users','sellers','categories','subcategories','listings','orders',
    'escrow_transactions','wallets','reviews','conversations','messages',
    'disputes','support_tickets','payment_methods','payments',
    'withdrawal_requests','game_slides','blog_posts','affiliate_referrals'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Only touch tables that actually exist and have an updatedAt column.
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'updatedAt'
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I;', t || '_updated_at', t);
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
        t || '_updated_at', t
      );
    END IF;
  END LOOP;
END $$;

-- 3) DIAGNOSTIC: list all remaining non-internal triggers --------------------
-- Review the output. Any trigger whose action_timing/manipulation includes
-- DELETE while its function references NEW is a potential culprit. Investigate
-- the function body with: SELECT pg_get_functiondef('<function>'::regproc);
SELECT
  event_object_table AS table_name,
  trigger_name,
  action_timing,
  string_agg(event_manipulation, ', ') AS events,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
GROUP BY event_object_table, trigger_name, action_timing, action_statement
ORDER BY event_object_table, trigger_name;
