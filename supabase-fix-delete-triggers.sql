-- =============================================================================
-- DEFINITIVE FIX: "The column `new` does not exist in the current database"
-- (real Postgres error: 42703  record "new" has no field "updatedAt")
-- =============================================================================
-- Symptom: deleting a listing (or other admin actions) fails with a Prisma
-- error "The column `new` does not exist in the current database".
--
-- Root cause: several tables have an `*_updated_at` BEFORE UPDATE trigger that
-- runs `NEW."updatedAt" = ...`, but those tables DO NOT have an `updatedAt`
-- column (e.g. order_items, notifications, commissions, wallet_transactions,
-- fraud_flags, dispute_messages, reward_coin_transactions, admin_audit_logs).
-- Any UPDATE to such a table therefore throws `record "new" has no field
-- "updatedAt"`. Deleting a listing that has order_items triggers a SetNull
-- UPDATE on order_items, which hits this and fails.
--
-- Fix: drop every `updated_at` trigger that sits on a table without an
-- `updatedAt` column. (Tables that DO have `updatedAt` keep their trigger.)
--
-- Run this ENTIRE script in the Supabase SQL Editor against the SAME database
-- your Render service uses (check DATABASE_URL). Idempotent + safe to re-run.
-- =============================================================================


-- 1) Make the shared trigger functions DELETE-safe (defensive) -----------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN RETURN OLD; END IF;
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN RETURN OLD; END IF;
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 2) Drop every updated_at trigger on a table that has NO updatedAt column -----
--    This is the actual bug: these triggers break every UPDATE on those tables.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT cl.relname AS table_name, tg.tgname AS trigger_name
    FROM pg_trigger tg
    JOIN pg_class cl     ON cl.oid = tg.tgrelid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace
    JOIN pg_proc pr      ON pr.oid = tg.tgfoid
    WHERE NOT tg.tgisinternal
      AND ns.nspname = 'public'
      AND pr.proname IN ('set_updated_at','update_updated_at')
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = cl.relname
          AND c.column_name = 'updatedAt'
      )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I;', r.trigger_name, r.table_name);
    RAISE NOTICE 'Dropped invalid updated_at trigger "%" on table "%"', r.trigger_name, r.table_name;
  END LOOP;
END $$;


-- 3) DIAGNOSTIC: confirm no updated_at trigger remains on a table lacking ------
--    an updatedAt column. This should return zero rows.
SELECT cl.relname AS table_name, tg.tgname AS trigger_name, pr.proname AS function_name
FROM pg_trigger tg
JOIN pg_class cl     ON cl.oid = tg.tgrelid
JOIN pg_namespace ns ON ns.oid = cl.relnamespace
JOIN pg_proc pr      ON pr.oid = tg.tgfoid
WHERE NOT tg.tgisinternal
  AND ns.nspname = 'public'
  AND pr.proname IN ('set_updated_at','update_updated_at')
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = cl.relname
      AND c.column_name = 'updatedAt'
  )
ORDER BY cl.relname;
