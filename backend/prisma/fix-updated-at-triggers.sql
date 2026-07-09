-- =============================================================================
-- Repair: remove broken "set_updated_at" triggers from tables that have no
-- "updatedAt" column.
--
-- Symptom this fixes:
--   Prisma error P2022 "The column `new` does not exist in the current database."
--   on admin deletes/updates (e.g. DELETE /api/v1/admin/listings/:id).
--
-- Cause:
--   A BEFORE UPDATE trigger runs `NEW."updatedAt" = CURRENT_TIMESTAMP` on every
--   listed table, but several tables (order_items, wallet_transactions,
--   notifications, dispute_messages, admin_audit_logs, fraud_flags, commissions,
--   reward_coin_transactions) have no "updatedAt" column. Any UPDATE on them --
--   including the FK "ON DELETE SET NULL" cascade from deleting a listing --
--   fails, and Prisma reports it as the "new" column not existing.
--
-- Safe to run multiple times (idempotent). It runs automatically on Render
-- startup (see the "start" script in package.json), or manually via:
--   prisma db execute --schema ./prisma/schema.prisma --file ./prisma/fix-updated-at-triggers.sql
-- =============================================================================

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_trigger tg
    JOIN pg_class c ON c.oid = tg.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND NOT tg.tgisinternal
      AND tg.tgname = c.relname || '_updated_at'
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns col
        WHERE col.table_schema = 'public'
          AND col.table_name = c.relname
          AND col.column_name = 'updatedAt'
      )
  LOOP
    RAISE NOTICE 'Dropping broken updatedAt trigger on table %', t;
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I;', t || '_updated_at', t);
  END LOOP;
END $$;
