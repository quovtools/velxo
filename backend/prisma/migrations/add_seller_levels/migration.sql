-- Additive migration: seller levels and response tracking
-- Safe to run multiple times (IF NOT EXISTS guards)

-- Create seller level enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE "SellerLevel" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'ELITE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add seller_level column to sellers
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS seller_level "SellerLevel" NOT NULL DEFAULT 'BRONZE';

-- Add avg response time and delivery success rate
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS avg_response_time_hours FLOAT NOT NULL DEFAULT 0;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS delivery_success_rate FLOAT NOT NULL DEFAULT 100;

-- Add last_seen_at to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP(3);

-- Backfill: compute initial seller levels from existing data
UPDATE sellers s
SET seller_level = CASE
  WHEN s.total_sales >= 200 AND s.average_rating >= 4.8 AND s.delivery_success_rate >= 98 THEN 'ELITE'::"SellerLevel"
  WHEN s.total_sales >= 50  AND s.average_rating >= 4.5 AND s.delivery_success_rate >= 95 THEN 'GOLD'::"SellerLevel"
  WHEN s.total_sales >= 10  AND s.average_rating >= 4.0 AND s.delivery_success_rate >= 90 THEN 'SILVER'::"SellerLevel"
  ELSE 'BRONZE'::"SellerLevel"
END;
