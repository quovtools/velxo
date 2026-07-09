-- =============================================================================
-- Velxo Project — Database schema (PostgreSQL)
-- -----------------------------------------------------------------------------
-- This file mirrors backend/prisma/schema.prisma. Use it to bootstrap a fresh
-- database or as a reference for hand-written migrations.
--
--   psql "$DATABASE_URL" -f prisma/schema.sql
--
-- NOTE: Prisma generates cuid() values in the application layer, so id columns
-- here are simply TEXT PRIMARY KEY with no default. If you prefer DB-generated
-- ids, switch to UUID with gen_random_uuid().
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CLEAN SLATE
-- -----------------------------------------------------------------------------
-- Drop any previously created (possibly partial/older) objects so this script
-- always builds a consistent schema. WARNING: this wipes all data in these
-- tables. Safe to run repeatedly. Remove this block if you want to preserve data.
DROP TABLE IF EXISTS
  "reward_redemptions", "reward_catalog", "reward_coin_transactions", "velxo_coins",
  "affiliate_referrals", "blog_posts", "game_slides", "commissions", "withdrawal_requests",
  "payments", "payment_methods", "fraud_flags", "admin_audit_logs", "support_tickets",
  "dispute_messages", "disputes", "notifications", "messages", "conversations", "reviews",
  "wallet_transactions", "wallets", "escrow_transactions", "gigs", "topup_products",
  "marquee_items", "order_items", "orders", "listings", "subcategories", "categories",
  "sellers", "users"
CASCADE;

DROP TYPE IF EXISTS
  "GigStatus", "SellerAccountType", "CommissionStatus", "AuditAction", "FraudFlagSeverity",
  "FraudFlagType", "SupportTicketCategory", "SupportTicketStatus", "NotificationType",
  "MessageSenderType", "DisputeResolutionType", "DisputeStatus", "WithdrawalStatus",
  "PaymentProvider", "PaymentStatus", "EscrowStatus", "OrderStatus", "ListingStatus", "Role"
CASCADE;

DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('BUYER', 'SELLER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'SOLD', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'DISPUTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "EscrowStatus" AS ENUM ('HELD', 'RELEASED', 'REFUNDED', 'DISPUTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentProvider" AS ENUM ('FLUTTERWAVE', 'PAYMENT_IO', 'CRYPTO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_BUYER', 'RESOLVED_SELLER', 'RESOLVED_PLATFORM', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DisputeResolutionType" AS ENUM ('REFUND_BUYER', 'RELEASE_TO_SELLER', 'SPLIT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "MessageSenderType" AS ENUM ('BUYER', 'SELLER', 'ADMIN', 'SUPPORT', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('ORDER_STATUS', 'MESSAGE', 'DISPUTE', 'WITHDRAWAL', 'LISTING_APPROVED', 'LISTING_REJECTED', 'FRAUD_ALERT', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SupportTicketCategory" AS ENUM ('PAYMENT', 'DELIVERY', 'ACCOUNT', 'DISPUTE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "FraudFlagType" AS ENUM ('SUSPICIOUS_LOGIN', 'RAPID_ORDERS', 'HIGH_VALUE_TRANSACTION', 'MULTIPLE_ACCOUNTS', 'CHARGEBACK_RISK', 'MANUAL_REVIEW');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "FraudFlagSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'PAYMENT', 'REFUND', 'ESCROW_RELEASE', 'WITHDRAWAL', 'ROLE_CHANGE', 'VERIFICATION_CHANGE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'PAID');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SellerAccountType" AS ENUM ('STANDARD', 'BOOSTER', 'BOTH');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "GigStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -----------------------------------------------------------------------------
-- TABLES
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "users" (
  "id"                    TEXT PRIMARY KEY,
  "email"                 TEXT NOT NULL,
  "emailVerified"         BOOLEAN NOT NULL DEFAULT false,
  "phone"                 TEXT,
  "phoneVerified"         BOOLEAN NOT NULL DEFAULT false,
  "passwordHash"          TEXT,
  "firstName"             TEXT,
  "lastName"              TEXT,
  "avatarUrl"             TEXT,
  "role"                  "Role" NOT NULL DEFAULT 'BUYER',
  "notificationPreferences" JSONB,
  "preferences"           JSONB,
  "isActive"              BOOLEAN NOT NULL DEFAULT true,
  "isBanned"              BOOLEAN NOT NULL DEFAULT false,
  "banReason"             TEXT,
  "lastLoginAt"           TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"             TIMESTAMP(3),
  CONSTRAINT "users_email_key" UNIQUE ("email")
);
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role");
CREATE INDEX IF NOT EXISTS "users_createdAt_idx" ON "users" ("createdAt");

CREATE TABLE IF NOT EXISTS "sellers" (
  "id"                    TEXT PRIMARY KEY,
  "userId"                TEXT NOT NULL,
  "storeName"             TEXT NOT NULL,
  "storeDescription"      TEXT,
  "accountType"           "SellerAccountType" NOT NULL DEFAULT 'STANDARD',
  "isVerified"            BOOLEAN NOT NULL DEFAULT false,
  "verificationDocuments" JSONB,
  "kycStatus"             TEXT NOT NULL DEFAULT 'NOT_SUBMITTED',
  "kycIdType"             TEXT,
  "kycFullName"           TEXT,
  "kycDocumentNumber"     TEXT,
  "kycIdImageUrl"         TEXT,
  "kycSelfieImageUrl"     TEXT,
  "kycSubmittedAt"        TIMESTAMP(3),
  "kycReviewedAt"         TIMESTAMP(3),
  "kycRejectionReason"    TEXT,
  "reputationScore"       DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "totalSales"            INTEGER NOT NULL DEFAULT 0,
  "totalRevenue"          DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "averageRating"         DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "responseRate"          DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "responseTime"          INTEGER,
  "subscriptionTier"      TEXT NOT NULL DEFAULT 'FREE',
  "subscriptionEndsAt"    TIMESTAMP(3),
  "featuredUntil"         TIMESTAMP(3),
  "isSuspended"           BOOLEAN NOT NULL DEFAULT false,
  "suspensionReason"      TEXT,
  "verifiedAt"            TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sellers_userId_key" UNIQUE ("userId"),
  CONSTRAINT "sellers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "sellers_userId_idx" ON "sellers" ("userId");
CREATE INDEX IF NOT EXISTS "sellers_isVerified_idx" ON "sellers" ("isVerified");
CREATE INDEX IF NOT EXISTS "sellers_kycStatus_idx" ON "sellers" ("kycStatus");
CREATE INDEX IF NOT EXISTS "sellers_reputationScore_idx" ON "sellers" ("reputationScore");
CREATE INDEX IF NOT EXISTS "sellers_totalSales_idx" ON "sellers" ("totalSales");

CREATE TABLE IF NOT EXISTS "categories" (
  "id"          TEXT PRIMARY KEY,
  "name"        TEXT NOT NULL,
  "slug"        TEXT NOT NULL,
  "description" TEXT,
  "icon"        TEXT,
  "imageUrl"    TEXT,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "categories_name_key" UNIQUE ("name"),
  CONSTRAINT "categories_slug_key" UNIQUE ("slug")
);
CREATE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories" ("slug");
CREATE INDEX IF NOT EXISTS "categories_sortOrder_idx" ON "categories" ("sortOrder");

CREATE TABLE IF NOT EXISTS "subcategories" (
  "id"          TEXT PRIMARY KEY,
  "categoryId"  TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "slug"        TEXT NOT NULL,
  "description" TEXT,
  "icon"        TEXT,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subcategories_categoryId_slug_key" UNIQUE ("categoryId", "slug"),
  CONSTRAINT "subcategories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "subcategories_categoryId_idx" ON "subcategories" ("categoryId");

CREATE TABLE IF NOT EXISTS "listings" (
  "id"              TEXT PRIMARY KEY,
  "sellerId"        TEXT NOT NULL,
  "categoryId"      TEXT NOT NULL,
  "subcategoryId"   TEXT,
  "title"           TEXT NOT NULL,
  "description"     TEXT NOT NULL,
  "price"           DECIMAL(12, 2) NOT NULL,
  "currency"        TEXT NOT NULL DEFAULT 'USD',
  "gameId"          TEXT,
  "gameName"        TEXT NOT NULL,
  "sku"             TEXT,
  "status"          "ListingStatus" NOT NULL DEFAULT 'DRAFT',
  "rank"            TEXT,
  "level"           INTEGER,
  "skins"           JSONB,
  "inventory"       JSONB,
  "linkedAccounts"  JSONB,
  "loginMethod"     TEXT,
  "region"          TEXT,
  "platform"        TEXT,
  "playerId"        TEXT,
  "playerUid"       TEXT,
  "deliveryTime"    INTEGER,
  "images"          TEXT[],
  "videos"          TEXT[],
  "screenshots"     TEXT[],
  "isFeatured"      BOOLEAN NOT NULL DEFAULT false,
  "isSponsored"     BOOLEAN NOT NULL DEFAULT false,
  "isSold"          BOOLEAN NOT NULL DEFAULT false,
  "viewCount"       INTEGER NOT NULL DEFAULT 0,
  "salesCount"      INTEGER NOT NULL DEFAULT 0,
  "moderationNotes" TEXT,
  "moderatedAt"     TIMESTAMP(3),
  "moderatedBy"     TEXT,
  "searchVector"    TSVECTOR,
  "metadata"        JSONB,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"       TIMESTAMP(3),
  CONSTRAINT "listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "listings_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON UPDATE CASCADE,
  CONSTRAINT "listings_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "subcategories" ("id") ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "listings_sellerId_idx" ON "listings" ("sellerId");
CREATE INDEX IF NOT EXISTS "listings_categoryId_idx" ON "listings" ("categoryId");
CREATE INDEX IF NOT EXISTS "listings_subcategoryId_idx" ON "listings" ("subcategoryId");
CREATE INDEX IF NOT EXISTS "listings_status_idx" ON "listings" ("status");
CREATE INDEX IF NOT EXISTS "listings_price_idx" ON "listings" ("price");
CREATE INDEX IF NOT EXISTS "listings_gameName_idx" ON "listings" ("gameName");
CREATE INDEX IF NOT EXISTS "listings_region_idx" ON "listings" ("region");
CREATE INDEX IF NOT EXISTS "listings_platform_idx" ON "listings" ("platform");
CREATE INDEX IF NOT EXISTS "listings_isFeatured_idx" ON "listings" ("isFeatured");
CREATE INDEX IF NOT EXISTS "listings_createdAt_idx" ON "listings" ("createdAt");

CREATE TABLE IF NOT EXISTS "orders" (
  "id"              TEXT PRIMARY KEY,
  "orderNumber"     TEXT NOT NULL,
  "buyerId"         TEXT NOT NULL,
  "sellerId"        TEXT,
  "status"          "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "subtotal"        DECIMAL(12, 2) NOT NULL,
  "taxAmount"       DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "discountAmount"  DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "totalAmount"     DECIMAL(12, 2) NOT NULL,
  "commissionRate"  DECIMAL(5, 4) NOT NULL DEFAULT 0.10,
  "commissionAmount" DECIMAL(12, 2) NOT NULL,
  "sellerPayout"    DECIMAL(12, 2) NOT NULL,
  "currency"        TEXT NOT NULL DEFAULT 'USD',
  "buyerNote"       TEXT,
  "sellerNote"      TEXT,
  "deliveryData"    JSONB,
  "paidAt"          TIMESTAMP(3),
  "deliveredAt"     TIMESTAMP(3),
  "completedAt"     TIMESTAMP(3),
  "cancelledAt"     TIMESTAMP(3),
  "refundedAt"      TIMESTAMP(3),
  "metadata"        JSONB,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "orders_orderNumber_key" UNIQUE ("orderNumber"),
  CONSTRAINT "orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users" ("id") ON UPDATE CASCADE,
  CONSTRAINT "orders_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers" ("id") ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "orders_buyerId_idx" ON "orders" ("buyerId");
CREATE INDEX IF NOT EXISTS "orders_sellerId_idx" ON "orders" ("sellerId");
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" ("status");
CREATE INDEX IF NOT EXISTS "orders_orderNumber_idx" ON "orders" ("orderNumber");
CREATE INDEX IF NOT EXISTS "orders_createdAt_idx" ON "orders" ("createdAt");

CREATE TABLE IF NOT EXISTS "order_items" (
  "id"          TEXT PRIMARY KEY,
  "orderId"     TEXT NOT NULL,
  "listingId"   TEXT,
  "quantity"    INTEGER NOT NULL DEFAULT 1,
  "unitPrice"   DECIMAL(12, 2) NOT NULL,
  "totalPrice"  DECIMAL(12, 2) NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "order_items_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings" ("id") ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "order_items_orderId_idx" ON "order_items" ("orderId");
CREATE INDEX IF NOT EXISTS "order_items_listingId_idx" ON "order_items" ("listingId");

CREATE TABLE IF NOT EXISTS "marquee_items" (
  "id"        TEXT PRIMARY KEY,
  "text"      TEXT NOT NULL,
  "linkHref"  TEXT,
  "linkText"  TEXT,
  "icon"      TEXT,
  "color"     TEXT DEFAULT 'brand',
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "marquee_items_isActive_sortOrder_idx" ON "marquee_items" ("isActive", "sortOrder");

CREATE TABLE IF NOT EXISTS "topup_products" (
  "id"           TEXT PRIMARY KEY,
  "gameName"     TEXT NOT NULL,
  "gameSlug"     TEXT,
  "title"        TEXT NOT NULL,
  "description"  TEXT,
  "price"        DECIMAL(12, 2) NOT NULL,
  "currency"     TEXT NOT NULL DEFAULT 'USD',
  "imageUrl"     TEXT,
  "region"       TEXT DEFAULT 'Global',
  "deliveryInfo" TEXT,
  "stock"        INTEGER DEFAULT -1,
  "sortOrder"    INTEGER NOT NULL DEFAULT 0,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "topup_products_isActive_sortOrder_idx" ON "topup_products" ("isActive", "sortOrder");
CREATE INDEX IF NOT EXISTS "topup_products_gameName_idx" ON "topup_products" ("gameName");

CREATE TABLE IF NOT EXISTS "gigs" (
  "id"              TEXT PRIMARY KEY,
  "sellerId"        TEXT NOT NULL,
  "title"           TEXT NOT NULL,
  "description"     TEXT NOT NULL,
  "gameName"        TEXT NOT NULL,
  "rankFrom"        TEXT,
  "rankTo"          TEXT,
  "platform"        TEXT,
  "region"          TEXT,
  "accountType"     TEXT DEFAULT 'RANK_BOOST',
  "price"           DECIMAL(12, 2) NOT NULL,
  "currency"        TEXT NOT NULL DEFAULT 'USD',
  "deliveryTime"    INTEGER,
  "imageUrl"        TEXT,
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "status"          "GigStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
  "rejectionReason" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "gigs_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "gigs_sellerId_idx" ON "gigs" ("sellerId");
CREATE INDEX IF NOT EXISTS "gigs_status_isActive_idx" ON "gigs" ("status", "isActive");
CREATE INDEX IF NOT EXISTS "gigs_gameName_idx" ON "gigs" ("gameName");

CREATE TABLE IF NOT EXISTS "escrow_transactions" (
  "id"          TEXT PRIMARY KEY,
  "orderId"     TEXT NOT NULL,
  "status"      "EscrowStatus" NOT NULL DEFAULT 'HELD',
  "amount"      DECIMAL(12, 2) NOT NULL,
  "currency"    TEXT NOT NULL DEFAULT 'USD',
  "releasedAt"  TIMESTAMP(3),
  "refundedAt"  TIMESTAMP(3),
  "disputedAt"  TIMESTAMP(3),
  "metadata"    JSONB,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "escrow_transactions_orderId_key" UNIQUE ("orderId"),
  CONSTRAINT "escrow_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "escrow_transactions_status_idx" ON "escrow_transactions" ("status");
CREATE INDEX IF NOT EXISTS "escrow_transactions_createdAt_idx" ON "escrow_transactions" ("createdAt");

CREATE TABLE IF NOT EXISTS "wallets" (
  "id"             TEXT PRIMARY KEY,
  "userId"         TEXT NOT NULL,
  "balance"        DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "currency"       TEXT NOT NULL DEFAULT 'USD',
  "lockedBalance"  DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "totalEarnings"  DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "totalWithdrawn" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallets_userId_key" UNIQUE ("userId"),
  CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "wallets_userId_idx" ON "wallets" ("userId");

CREATE TABLE IF NOT EXISTS "wallet_transactions" (
  "id"           TEXT PRIMARY KEY,
  "walletId"     TEXT NOT NULL,
  "type"         TEXT NOT NULL,
  "amount"       DECIMAL(12, 2) NOT NULL,
  "currency"     TEXT NOT NULL DEFAULT 'USD',
  "balanceAfter" DECIMAL(12, 2) NOT NULL,
  "description"  TEXT NOT NULL,
  "relatedId"    TEXT,
  "metadata"     JSONB,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "wallet_transactions_walletId_idx" ON "wallet_transactions" ("walletId");
CREATE INDEX IF NOT EXISTS "wallet_transactions_createdAt_idx" ON "wallet_transactions" ("createdAt");

CREATE TABLE IF NOT EXISTS "reviews" (
  "id"               TEXT PRIMARY KEY,
  "orderId"          TEXT NOT NULL,
  "listingId"        TEXT NOT NULL,
  "buyerId"          TEXT NOT NULL,
  "sellerId"         TEXT NOT NULL,
  "rating"           INTEGER NOT NULL,
  "comment"          TEXT NOT NULL,
  "isEdited"         BOOLEAN NOT NULL DEFAULT false,
  "isHidden"         BOOLEAN NOT NULL DEFAULT false,
  "helpfulCount"     INTEGER NOT NULL DEFAULT 0,
  "sellerResponse"   TEXT,
  "sellerRespondedAt" TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reviews_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "reviews_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users" ("id") ON UPDATE CASCADE,
  CONSTRAINT "reviews_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers" ("id") ON UPDATE CASCADE,
  CONSTRAINT "reviews_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings" ("id") ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "reviews_sellerId_idx" ON "reviews" ("sellerId");
CREATE INDEX IF NOT EXISTS "reviews_listingId_idx" ON "reviews" ("listingId");
CREATE INDEX IF NOT EXISTS "reviews_rating_idx" ON "reviews" ("rating");
CREATE INDEX IF NOT EXISTS "reviews_createdAt_idx" ON "reviews" ("createdAt");

CREATE TABLE IF NOT EXISTS "conversations" (
  "id"             TEXT PRIMARY KEY,
  "buyerId"        TEXT NOT NULL,
  "sellerId"       TEXT NOT NULL,
  "orderId"        TEXT,
  "isBlocked"      BOOLEAN NOT NULL DEFAULT false,
  "lastMessageAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "conversations_buyerId_sellerId_idx" ON "conversations" ("buyerId", "sellerId");

CREATE TABLE IF NOT EXISTS "messages" (
  "id"             TEXT PRIMARY KEY,
  "conversationId" TEXT NOT NULL,
  "senderId"       TEXT NOT NULL,
  "senderType"     "MessageSenderType" NOT NULL DEFAULT 'BUYER',
  "content"        TEXT NOT NULL,
  "attachments"    TEXT[],
  "isRead"         BOOLEAN NOT NULL DEFAULT false,
  "readAt"         TIMESTAMP(3),
  "isDeleted"      BOOLEAN NOT NULL DEFAULT false,
  "metadata"       JSONB,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "messages_conversationId_idx" ON "messages" ("conversationId");
CREATE INDEX IF NOT EXISTS "messages_senderId_idx" ON "messages" ("senderId");
CREATE INDEX IF NOT EXISTS "messages_isRead_idx" ON "messages" ("isRead");
CREATE INDEX IF NOT EXISTS "messages_createdAt_idx" ON "messages" ("createdAt");

CREATE TABLE IF NOT EXISTS "notifications" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL,
  "type"      "NotificationType" NOT NULL,
  "title"     TEXT NOT NULL,
  "body"      TEXT NOT NULL,
  "data"      JSONB,
  "isRead"    BOOLEAN NOT NULL DEFAULT false,
  "readAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "notifications_userId_isRead_idx" ON "notifications" ("userId", "isRead");
CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications" ("createdAt");

CREATE TABLE IF NOT EXISTS "disputes" (
  "id"              TEXT PRIMARY KEY,
  "orderId"         TEXT NOT NULL,
  "initiatedById"   TEXT NOT NULL,
  "status"          "DisputeStatus" NOT NULL DEFAULT 'OPEN',
  "reason"          TEXT NOT NULL,
  "evidence"        JSONB,
  "resolutionType"  "DisputeResolutionType",
  "resolutionNotes" TEXT,
  "refundAmount"    DECIMAL(12, 2),
  "resolvedBy"      TEXT,
  "resolvedAt"      TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "disputes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON UPDATE CASCADE,
  CONSTRAINT "disputes_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "users" ("id") ON UPDATE CASCADE,
  CONSTRAINT "disputes_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "users" ("id") ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "disputes_orderId_idx" ON "disputes" ("orderId");
CREATE INDEX IF NOT EXISTS "disputes_status_idx" ON "disputes" ("status");
CREATE INDEX IF NOT EXISTS "disputes_createdAt_idx" ON "disputes" ("createdAt");

CREATE TABLE IF NOT EXISTS "dispute_messages" (
  "id"          TEXT PRIMARY KEY,
  "disputeId"   TEXT NOT NULL,
  "senderId"    TEXT NOT NULL,
  "content"     TEXT NOT NULL,
  "attachments" TEXT[],
  "isSystem"    BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dispute_messages_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "dispute_messages_disputeId_idx" ON "dispute_messages" ("disputeId");

CREATE TABLE IF NOT EXISTS "support_tickets" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL,
  "subject"     TEXT NOT NULL,
  "category"    "SupportTicketCategory" NOT NULL,
  "priority"    TEXT NOT NULL DEFAULT 'MEDIUM',
  "status"      "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
  "assigneeId"  TEXT,
  "tags"        TEXT[],
  "metadata"    JSONB,
  "closedAt"    TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "support_tickets_userId_idx" ON "support_tickets" ("userId");
CREATE INDEX IF NOT EXISTS "support_tickets_status_idx" ON "support_tickets" ("status");
CREATE INDEX IF NOT EXISTS "support_tickets_priority_idx" ON "support_tickets" ("priority");

CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
  "id"          TEXT PRIMARY KEY,
  "actorId"     TEXT NOT NULL,
  "action"      "AuditAction" NOT NULL,
  "entityType"  TEXT NOT NULL,
  "entityId"    TEXT NOT NULL,
  "oldValue"    JSONB,
  "newValue"    JSONB,
  "ipAddress"   TEXT,
  "userAgent"   TEXT,
  "metadata"    JSONB,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users" ("id") ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "admin_audit_logs_actorId_idx" ON "admin_audit_logs" ("actorId");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_entityType_entityId_idx" ON "admin_audit_logs" ("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_action_idx" ON "admin_audit_logs" ("action");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_createdAt_idx" ON "admin_audit_logs" ("createdAt");

CREATE TABLE IF NOT EXISTS "fraud_flags" (
  "id"         TEXT PRIMARY KEY,
  "userId"     TEXT NOT NULL,
  "listingId"  TEXT,
  "orderId"    TEXT,
  "type"       "FraudFlagType" NOT NULL,
  "severity"   "FraudFlagSeverity" NOT NULL,
  "status"     TEXT NOT NULL DEFAULT 'OPEN',
  "score"      DOUBLE PRECISION,
  "details"    JSONB,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fraud_flags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON UPDATE CASCADE,
  CONSTRAINT "fraud_flags_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings" ("id") ON UPDATE CASCADE,
  CONSTRAINT "fraud_flags_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "fraud_flags_userId_idx" ON "fraud_flags" ("userId");
CREATE INDEX IF NOT EXISTS "fraud_flags_status_idx" ON "fraud_flags" ("status");
CREATE INDEX IF NOT EXISTS "fraud_flags_severity_idx" ON "fraud_flags" ("severity");
CREATE INDEX IF NOT EXISTS "fraud_flags_createdAt_idx" ON "fraud_flags" ("createdAt");

CREATE TABLE IF NOT EXISTS "payment_methods" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL,
  "provider"  "PaymentProvider" NOT NULL,
  "type"      TEXT NOT NULL,
  "last4"     TEXT,
  "brand"     TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "metadata"  JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "payment_methods_userId_idx" ON "payment_methods" ("userId");

CREATE TABLE IF NOT EXISTS "payments" (
  "id"                    TEXT PRIMARY KEY,
  "orderId"               TEXT NOT NULL,
  "methodId"              TEXT,
  "provider"              "PaymentProvider" NOT NULL,
  "status"                "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "amount"                DECIMAL(12, 2) NOT NULL,
  "currency"              TEXT NOT NULL DEFAULT 'USD',
  "providerTransactionId" TEXT,
  "metadata"              JSONB,
  "errorMessage"          TEXT,
  "paidAt"                TIMESTAMP(3),
  "refundedAt"            TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "payments_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "payment_methods" ("id") ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "payments_orderId_idx" ON "payments" ("orderId");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments" ("status");
CREATE INDEX IF NOT EXISTS "payments_providerTransactionId_idx" ON "payments" ("providerTransactionId");

CREATE TABLE IF NOT EXISTS "withdrawal_requests" (
  "id"          TEXT PRIMARY KEY,
  "sellerId"    TEXT NOT NULL,
  "amount"      DECIMAL(12, 2) NOT NULL,
  "currency"    TEXT NOT NULL DEFAULT 'USD',
  "status"      "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
  "method"      TEXT NOT NULL,
  "destination" JSONB NOT NULL,
  "fee"         DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "netAmount"   DECIMAL(12, 2) NOT NULL,
  "processedBy" TEXT,
  "notes"       TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "withdrawal_requests_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers" ("id") ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "withdrawal_requests_sellerId_idx" ON "withdrawal_requests" ("sellerId");
CREATE INDEX IF NOT EXISTS "withdrawal_requests_status_idx" ON "withdrawal_requests" ("status");
CREATE INDEX IF NOT EXISTS "withdrawal_requests_createdAt_idx" ON "withdrawal_requests" ("createdAt");

CREATE TABLE IF NOT EXISTS "commissions" (
  "id"        TEXT PRIMARY KEY,
  "orderId"   TEXT NOT NULL,
  "sellerId"  TEXT NOT NULL,
  "rate"      DECIMAL(5, 4) NOT NULL,
  "amount"    DECIMAL(12, 2) NOT NULL,
  "currency"  TEXT NOT NULL DEFAULT 'USD',
  "status"    "CommissionStatus" NOT NULL DEFAULT 'PENDING',
  "paidAt"    TIMESTAMP(3),
  "dueAt"     TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commissions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON UPDATE CASCADE,
  CONSTRAINT "commissions_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers" ("id") ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "commissions_sellerId_status_idx" ON "commissions" ("sellerId", "status");

CREATE TABLE IF NOT EXISTS "game_slides" (
  "id"        TEXT PRIMARY KEY,
  "title"     TEXT NOT NULL,
  "subtitle"  TEXT,
  "imageUrl"  TEXT NOT NULL,
  "linkHref"  TEXT,
  "badge"     TEXT,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "game_slides_isActive_sortOrder_idx" ON "game_slides" ("isActive", "sortOrder");

CREATE TABLE IF NOT EXISTS "blog_posts" (
  "id"          TEXT PRIMARY KEY,
  "title"       TEXT NOT NULL,
  "slug"        TEXT NOT NULL,
  "excerpt"     TEXT NOT NULL,
  "content"     TEXT NOT NULL,
  "category"    TEXT NOT NULL DEFAULT 'Platform',
  "author"      TEXT NOT NULL DEFAULT 'Velxo Team',
  "coverImage"  TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "isFeatured"  BOOLEAN NOT NULL DEFAULT false,
  "readTime"    TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug")
);
CREATE INDEX IF NOT EXISTS "blog_posts_isPublished_isFeatured_idx" ON "blog_posts" ("isPublished", "isFeatured");
CREATE INDEX IF NOT EXISTS "blog_posts_slug_idx" ON "blog_posts" ("slug");
CREATE INDEX IF NOT EXISTS "blog_posts_category_idx" ON "blog_posts" ("category");
CREATE INDEX IF NOT EXISTS "blog_posts_publishedAt_idx" ON "blog_posts" ("publishedAt");

CREATE TABLE IF NOT EXISTS "affiliate_referrals" (
  "id"              TEXT PRIMARY KEY,
  "referrerId"      TEXT NOT NULL,
  "referredUserId"  TEXT,
  "referralCode"    TEXT NOT NULL,
  "status"          TEXT NOT NULL DEFAULT 'PENDING',
  "commissionRate"  DECIMAL(5, 4) NOT NULL DEFAULT 0.02,
  "totalEarned"     DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "totalPaid"       DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "clickCount"      INTEGER NOT NULL DEFAULT 0,
  "signupCount"     INTEGER NOT NULL DEFAULT 0,
  "tradeCount"      INTEGER NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "affiliate_referrals_referredUserId_key" UNIQUE ("referredUserId"),
  CONSTRAINT "affiliate_referrals_referralCode_key" UNIQUE ("referralCode"),
  CONSTRAINT "affiliate_referrals_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "users" ("id") ON UPDATE CASCADE,
  CONSTRAINT "affiliate_referrals_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "users" ("id") ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "affiliate_referrals_referrerId_idx" ON "affiliate_referrals" ("referrerId");
CREATE INDEX IF NOT EXISTS "affiliate_referrals_referralCode_idx" ON "affiliate_referrals" ("referralCode");
CREATE INDEX IF NOT EXISTS "affiliate_referrals_status_idx" ON "affiliate_referrals" ("status");

CREATE TABLE IF NOT EXISTS "velxo_coins" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL,
  "balance"   INTEGER NOT NULL DEFAULT 0,
  "currency"  TEXT NOT NULL DEFAULT 'VXC',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "velxo_coins_userId_key" UNIQUE ("userId"),
  CONSTRAINT "velxo_coins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "velxo_coins_userId_idx" ON "velxo_coins" ("userId");

CREATE TABLE IF NOT EXISTS "reward_coin_transactions" (
  "id"           TEXT PRIMARY KEY,
  "coinId"       TEXT NOT NULL,
  "type"         TEXT NOT NULL,
  "amount"       INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "description"  TEXT NOT NULL,
  "relatedId"    TEXT,
  "metadata"     JSONB,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reward_coin_transactions_coinId_fkey" FOREIGN KEY ("coinId") REFERENCES "velxo_coins" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "reward_coin_transactions_coinId_idx" ON "reward_coin_transactions" ("coinId");
CREATE INDEX IF NOT EXISTS "reward_coin_transactions_createdAt_idx" ON "reward_coin_transactions" ("createdAt");

CREATE TABLE IF NOT EXISTS "reward_catalog" (
  "id"          TEXT PRIMARY KEY,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "type"        TEXT NOT NULL,
  "coinCost"    INTEGER NOT NULL,
  "imageUrl"    TEXT,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "metadata"    JSONB,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "reward_catalog_isActive_sortOrder_idx" ON "reward_catalog" ("isActive", "sortOrder");

CREATE TABLE IF NOT EXISTS "reward_redemptions" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL,
  "catalogId"   TEXT NOT NULL,
  "coinCost"    INTEGER NOT NULL,
  "status"      TEXT NOT NULL DEFAULT 'PENDING',
  "metadata"    JSONB,
  "processedBy" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reward_redemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON UPDATE CASCADE,
  CONSTRAINT "reward_redemptions_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "reward_catalog" ("id") ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "reward_redemptions_userId_idx" ON "reward_redemptions" ("userId");
CREATE INDEX IF NOT EXISTS "reward_redemptions_status_idx" ON "reward_redemptions" ("status");
CREATE INDEX IF NOT EXISTS "reward_redemptions_createdAt_idx" ON "reward_redemptions" ("createdAt");

-- -----------------------------------------------------------------------------
-- updatedAt maintenance trigger (optional, mirrors Prisma @updatedAt behaviour)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename IN (
      'users','sellers','categories','subcategories','listings','orders','order_items',
      'marquee_items','topup_products','gigs','escrow_transactions','wallets',
      'wallet_transactions','reviews','conversations','messages','notifications',
      'disputes','dispute_messages','support_tickets','admin_audit_logs','fraud_flags',
      'payment_methods','payments','withdrawal_requests','commissions','game_slides',
      'blog_posts','affiliate_referrals','velxo_coins','reward_coin_transactions',
      'reward_catalog','reward_redemptions'
    )
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON %I;
       CREATE TRIGGER %I BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      t || '_updated_at', t, t || '_updated_at', t
    );
  END LOOP;
END $$;
