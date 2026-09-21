-- ============================================================
-- sync_schema_drift
-- Brings the live database in line with schema.prisma.
-- Supersedes the failed `add_seller_levels` migration, which used
-- snake_case column names and referenced non-existent columns
-- (total_sales / average_rating), causing error 42703 and leaving
-- Prisma's migration history locked.
--
-- This migration is ADDITIVE and IDEMPOTENT:
--   * No tables or columns are dropped.
--   * The PaymentProvider enum is intentionally NOT modified: the live
--     database already contains every value defined in schema.prisma plus
--     an extra 'CRYPTO' value that must be preserved.
-- ============================================================

-- SellerLevel enum (guarded, so this also works on a fresh database)
DO $$ BEGIN
  CREATE TYPE "SellerLevel" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'ELITE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- sellers: level + performance metrics (camelCase to match schema.prisma)
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "sellerLevel"          "SellerLevel"    NOT NULL DEFAULT 'BRONZE';
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "avgResponseTimeHours" DOUBLE PRECISION  NOT NULL DEFAULT 0.0;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "deliverySuccessRate"  DOUBLE PRECISION  NOT NULL DEFAULT 100.0;

-- users: presence tracking (schema maps lastSeenAt -> last_seen_at)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_seen_at" TIMESTAMP(3);

-- listings: default currency is NGN in schema.prisma (affects new rows only)
ALTER TABLE "listings" ALTER COLUMN "currency" SET DEFAULT 'NGN';

-- Rename the unique index on sellers.storeSlug to Prisma's expected name.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'sellers' AND indexname = 'sellers_store_slug_key')
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'sellers' AND indexname = 'sellers_storeSlug_key')
  THEN
    ALTER INDEX "sellers_store_slug_key" RENAME TO "sellers_storeSlug_key";
  END IF;
END $$;
