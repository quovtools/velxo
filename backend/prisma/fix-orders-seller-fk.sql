-- One-time backfill to align orders.sellerId / commissions.sellerId with the
-- "reference sellers" model. After the refactor these columns should hold a
-- sellers.id, but legacy rows may still store the seller's user id. This maps
-- any user-id value to the corresponding sellers.id so `prisma db push` can
-- safely apply the foreign key to the sellers table.
--
-- Idempotent: rows whose sellerId is already a valid sellers.id are untouched.

-- orders
UPDATE orders o
SET "sellerId" = s.id
FROM sellers s
WHERE o."sellerId" = s."userId"
  AND NOT EXISTS (SELECT 1 FROM sellers s2 WHERE s2.id = o."sellerId");

-- commissions
UPDATE commissions c
SET "sellerId" = s.id
FROM sellers s
WHERE c."sellerId" = s."userId"
  AND NOT EXISTS (SELECT 1 FROM sellers s2 WHERE s2.id = c."sellerId");
