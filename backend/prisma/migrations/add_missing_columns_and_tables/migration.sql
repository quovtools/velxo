-- ============================================================
-- Comprehensive additive migration — all columns and tables
-- that exist in schema.prisma but were never migrated to the DB.
-- Every statement uses IF NOT EXISTS / DO $$ guards so it is
-- safe to run multiple times.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. ENUM additions
-- ─────────────────────────────────────────────────────────────

-- PaymentProvider: add values missing from the original enum
DO $$ BEGIN
  ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'PAYSTACK';
EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN
  ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'MOMO_MTN';
EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN
  ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'MOMO_AIRTEL';
EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN
  ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'MOMO_VODAFONE';
EXCEPTION WHEN others THEN null; END $$;

-- BuyerRequestStatus
DO $$ BEGIN
  CREATE TYPE "BuyerRequestStatus" AS ENUM ('OPEN', 'CLOSED', 'EXPIRED', 'FLAGGED', 'AUTO_SUSPENDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- BuyerRequestItemType
DO $$ BEGIN
  CREATE TYPE "BuyerRequestItemType" AS ENUM ('ACCOUNT', 'CURRENCY', 'BOOSTING', 'ITEM', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- DeliveryTimeframe
DO $$ BEGIN
  CREATE TYPE "DeliveryTimeframe" AS ENUM ('WITHIN_1_HOUR', 'WITHIN_24_HOURS', 'WITHIN_3_DAYS', 'WITHIN_7_DAYS', 'FLEXIBLE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- LiveChatStatus
DO $$ BEGIN
  CREATE TYPE "LiveChatStatus" AS ENUM ('OPEN', 'ASSIGNED', 'RESOLVED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- SellerLevel (may already exist from add_seller_levels migration)
DO $$ BEGIN
  CREATE TYPE "SellerLevel" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'ELITE');
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ─────────────────────────────────────────────────────────────
-- 2. USERS — missing columns
-- ─────────────────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "externalContactStrikes" INTEGER NOT NULL DEFAULT 0;


-- ─────────────────────────────────────────────────────────────
-- 3. LISTINGS — missing columns
-- ─────────────────────────────────────────────────────────────

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS "featuredAt"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "featuredByAlgo" BOOLEAN NOT NULL DEFAULT false;


-- ─────────────────────────────────────────────────────────────
-- 4. SELLERS — missing columns
-- ─────────────────────────────────────────────────────────────

ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS "storeSlug" TEXT,
  ADD COLUMN IF NOT EXISTS "metadata"  JSONB;

-- Unique index on storeSlug (only if column was just added and index doesn't exist)
DO $$ BEGIN
  CREATE UNIQUE INDEX sellers_store_slug_key ON sellers("storeSlug");
EXCEPTION WHEN duplicate_table THEN null; END $$;


-- ─────────────────────────────────────────────────────────────
-- 5. ORDERS — missing columns
-- ─────────────────────────────────────────────────────────────

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS "lockedRate"             DECIMAL(18,8),
  ADD COLUMN IF NOT EXISTS "lockedCurrency"         TEXT,
  ADD COLUMN IF NOT EXISTS "acceptedAt"             TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "sellerDeliverDeadline"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "buyerConfirmDeadline"   TIMESTAMP(3);


-- ─────────────────────────────────────────────────────────────
-- 6. MESSAGES — missing columns
-- ─────────────────────────────────────────────────────────────

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS "attachmentUrl"  TEXT,
  ADD COLUMN IF NOT EXISTS "attachmentType" TEXT,
  ADD COLUMN IF NOT EXISTS "attachmentName" TEXT;


-- ─────────────────────────────────────────────────────────────
-- 7. DISPUTES — missing columns
-- ─────────────────────────────────────────────────────────────

ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS "evidenceUrls" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "evidenceText" TEXT;


-- ─────────────────────────────────────────────────────────────
-- 8. NEW TABLES
-- ─────────────────────────────────────────────────────────────

-- seller_subscriptions
CREATE TABLE IF NOT EXISTS "seller_subscriptions" (
  "id"          TEXT        NOT NULL,
  "sellerId"    TEXT        NOT NULL,
  "plan"        TEXT        NOT NULL,
  "status"      TEXT        NOT NULL DEFAULT 'PENDING',
  "amount"      DECIMAL(12,2) NOT NULL,
  "currency"    TEXT        NOT NULL DEFAULT 'NGN',
  "provider"    TEXT        NOT NULL,
  "providerRef" TEXT,
  "startsAt"    TIMESTAMP(3),
  "endsAt"      TIMESTAMP(3),
  "metadata"    JSONB,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "seller_subscriptions_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "seller_subscriptions"
    ADD CONSTRAINT "seller_subscriptions_sellerId_fkey"
    FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE INDEX IF NOT EXISTS "seller_subscriptions_sellerId_idx" ON "seller_subscriptions"("sellerId");
CREATE INDEX IF NOT EXISTS "seller_subscriptions_status_idx"   ON "seller_subscriptions"("status");

-- escrow_milestones
CREATE TABLE IF NOT EXISTS "escrow_milestones" (
  "id"         TEXT        NOT NULL,
  "escrowId"   TEXT        NOT NULL,
  "label"      TEXT        NOT NULL,
  "amount"     DECIMAL(12,2) NOT NULL,
  "status"     TEXT        NOT NULL DEFAULT 'HELD',
  "releasedAt" TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "escrow_milestones_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "escrow_milestones"
    ADD CONSTRAINT "escrow_milestones_escrowId_fkey"
    FOREIGN KEY ("escrowId") REFERENCES "escrow_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- push_subscriptions
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "endpoint"  TEXT NOT NULL,
  "p256dh"    TEXT NOT NULL,
  "auth"      TEXT NOT NULL,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");
EXCEPTION WHEN duplicate_table THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE INDEX IF NOT EXISTS "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- saved_searches
CREATE TABLE IF NOT EXISTS "saved_searches" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "params"    JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "saved_searches"
    ADD CONSTRAINT "saved_searches_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE INDEX IF NOT EXISTS "saved_searches_userId_idx" ON "saved_searches"("userId");

-- affiliate_signup_rewards
CREATE TABLE IF NOT EXISTS "affiliate_signup_rewards" (
  "id"             TEXT NOT NULL,
  "referrerId"     TEXT NOT NULL,
  "referredUserId" TEXT NOT NULL,
  "rewardAmount"   DECIMAL(12,2) NOT NULL,
  "currency"       TEXT NOT NULL DEFAULT 'NGN',
  "paid"           BOOLEAN NOT NULL DEFAULT false,
  "paidAt"         TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "affiliate_signup_rewards_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  CREATE UNIQUE INDEX "affiliate_signup_rewards_referredUserId_key" ON "affiliate_signup_rewards"("referredUserId");
EXCEPTION WHEN duplicate_table THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "affiliate_signup_rewards"
    ADD CONSTRAINT "affiliate_signup_rewards_referrerId_fkey"
    FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "affiliate_signup_rewards"
    ADD CONSTRAINT "affiliate_signup_rewards_referredUserId_fkey"
    FOREIGN KEY ("referredUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE INDEX IF NOT EXISTS "affiliate_signup_rewards_referrerId_idx" ON "affiliate_signup_rewards"("referrerId");
CREATE INDEX IF NOT EXISTS "affiliate_signup_rewards_paid_idx"        ON "affiliate_signup_rewards"("paid");

-- creator_profiles
CREATE TABLE IF NOT EXISTS "creator_profiles" (
  "id"                    TEXT NOT NULL,
  "userId"                TEXT NOT NULL,
  "handle"                TEXT,
  "platform"              TEXT,
  "followerCount"         INTEGER NOT NULL DEFAULT 0,
  "isVerified"            BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt"            TIMESTAMP(3),
  "status"                TEXT NOT NULL DEFAULT 'PENDING',
  "rejectionReason"       TEXT,
  "hasFreePremium"        BOOLEAN NOT NULL DEFAULT false,
  "premiumGrantedAt"      TIMESTAMP(3),
  "creatorCommissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0.20,
  "signupRewardBase"      DECIMAL(8,2) NOT NULL DEFAULT 10,
  "tier"                  TEXT NOT NULL DEFAULT 'STARTER',
  "hasTournamentSlot"     BOOLEAN NOT NULL DEFAULT false,
  "bio"                   TEXT,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "creator_profiles_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  CREATE UNIQUE INDEX "creator_profiles_userId_key" ON "creator_profiles"("userId");
EXCEPTION WHEN duplicate_table THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "creator_profiles"
    ADD CONSTRAINT "creator_profiles_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE INDEX IF NOT EXISTS "creator_profiles_status_idx"     ON "creator_profiles"("status");
CREATE INDEX IF NOT EXISTS "creator_profiles_isVerified_idx" ON "creator_profiles"("isVerified");

-- game_banners
CREATE TABLE IF NOT EXISTS "game_banners" (
  "id"        TEXT NOT NULL,
  "gameName"  TEXT NOT NULL,
  "gameSlug"  TEXT NOT NULL,
  "bannerUrl" TEXT NOT NULL,
  "bannerKey" TEXT,
  "color"     TEXT,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "game_banners_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  CREATE UNIQUE INDEX "game_banners_gameName_key" ON "game_banners"("gameName");
EXCEPTION WHEN duplicate_table THEN null; END $$;
DO $$ BEGIN
  CREATE UNIQUE INDEX "game_banners_gameSlug_key" ON "game_banners"("gameSlug");
EXCEPTION WHEN duplicate_table THEN null; END $$;
CREATE INDEX IF NOT EXISTS "game_banners_isActive_sortOrder_idx" ON "game_banners"("isActive", "sortOrder");
CREATE INDEX IF NOT EXISTS "game_banners_gameSlug_idx"           ON "game_banners"("gameSlug");

-- forum_threads
CREATE TABLE IF NOT EXISTS "forum_threads" (
  "id"             TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "content"        TEXT NOT NULL,
  "category"       TEXT NOT NULL DEFAULT 'General',
  "tags"           TEXT[] NOT NULL DEFAULT '{}',
  "isPinned"       BOOLEAN NOT NULL DEFAULT false,
  "isLocked"       BOOLEAN NOT NULL DEFAULT false,
  "viewCount"      INTEGER NOT NULL DEFAULT 0,
  "authorId"       TEXT NOT NULL,
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "forum_threads_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "forum_threads"
    ADD CONSTRAINT "forum_threads_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE INDEX IF NOT EXISTS "forum_threads_category_isPinned_createdAt_idx" ON "forum_threads"("category", "isPinned", "createdAt");
CREATE INDEX IF NOT EXISTS "forum_threads_authorId_idx"                     ON "forum_threads"("authorId");
CREATE INDEX IF NOT EXISTS "forum_threads_lastActivityAt_idx"               ON "forum_threads"("lastActivityAt");

-- forum_posts
CREATE TABLE IF NOT EXISTS "forum_posts" (
  "id"        TEXT NOT NULL,
  "content"   TEXT NOT NULL,
  "isHidden"  BOOLEAN NOT NULL DEFAULT false,
  "authorId"  TEXT NOT NULL,
  "threadId"  TEXT NOT NULL,
  "parentId"  TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "forum_posts"
    ADD CONSTRAINT "forum_posts_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "forum_posts"
    ADD CONSTRAINT "forum_posts_threadId_fkey"
    FOREIGN KEY ("threadId") REFERENCES "forum_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "forum_posts"
    ADD CONSTRAINT "forum_posts_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "forum_posts"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE INDEX IF NOT EXISTS "forum_posts_threadId_createdAt_idx" ON "forum_posts"("threadId", "createdAt");
CREATE INDEX IF NOT EXISTS "forum_posts_authorId_idx"           ON "forum_posts"("authorId");
CREATE INDEX IF NOT EXISTS "forum_posts_parentId_idx"           ON "forum_posts"("parentId");

-- buyer_requests
CREATE TABLE IF NOT EXISTS "buyer_requests" (
  "id"                        TEXT NOT NULL,
  "buyerId"                   TEXT NOT NULL,
  "gameName"                  TEXT NOT NULL,
  "gameSlug"                  TEXT,
  "title"                     TEXT NOT NULL,
  "description"               TEXT NOT NULL,
  "itemType"                  "BuyerRequestItemType" NOT NULL DEFAULT 'ACCOUNT',
  "budgetMin"                 DECIMAL(12,2),
  "budgetMax"                 DECIMAL(12,2),
  "budget"                    DECIMAL(12,2),
  "currency"                  TEXT NOT NULL DEFAULT 'NGN',
  "region"                    TEXT,
  "platform"                  TEXT,
  "rank"                      TEXT,
  "deliveryTimeframe"         "DeliveryTimeframe" NOT NULL DEFAULT 'FLEXIBLE',
  "requiredVerificationLevel" TEXT,
  "status"                    "BuyerRequestStatus" NOT NULL DEFAULT 'OPEN',
  "flagCount"                 INTEGER NOT NULL DEFAULT 0,
  "isFlagged"                 BOOLEAN NOT NULL DEFAULT false,
  "flagReason"                TEXT,
  "flaggedAt"                 TIMESTAMP(3),
  "reviewedByAdminAt"         TIMESTAMP(3),
  "reviewedByAdminId"         TEXT,
  "externalContactAttempts"   INTEGER NOT NULL DEFAULT 0,
  "expiresAt"                 TIMESTAMP(3),
  "createdAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "buyer_requests_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "buyer_requests"
    ADD CONSTRAINT "buyer_requests_buyerId_fkey"
    FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE INDEX IF NOT EXISTS "buyer_requests_buyerId_idx"   ON "buyer_requests"("buyerId");
CREATE INDEX IF NOT EXISTS "buyer_requests_gameName_idx"  ON "buyer_requests"("gameName");
CREATE INDEX IF NOT EXISTS "buyer_requests_status_idx"    ON "buyer_requests"("status");
CREATE INDEX IF NOT EXISTS "buyer_requests_isFlagged_idx" ON "buyer_requests"("isFlagged");
CREATE INDEX IF NOT EXISTS "buyer_requests_itemType_idx"  ON "buyer_requests"("itemType");
CREATE INDEX IF NOT EXISTS "buyer_requests_createdAt_idx" ON "buyer_requests"("createdAt");

-- buyer_request_offers
CREATE TABLE IF NOT EXISTS "buyer_request_offers" (
  "id"           TEXT NOT NULL,
  "requestId"    TEXT NOT NULL,
  "sellerId"     TEXT NOT NULL,
  "message"      TEXT NOT NULL,
  "price"        DECIMAL(12,2) NOT NULL,
  "currency"     TEXT NOT NULL DEFAULT 'NGN',
  "deliveryTime" INTEGER,
  "status"       TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "buyer_request_offers_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "buyer_request_offers"
    ADD CONSTRAINT "buyer_request_offers_requestId_fkey"
    FOREIGN KEY ("requestId") REFERENCES "buyer_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "buyer_request_offers"
    ADD CONSTRAINT "buyer_request_offers_sellerId_fkey"
    FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE INDEX IF NOT EXISTS "buyer_request_offers_requestId_idx" ON "buyer_request_offers"("requestId");
CREATE INDEX IF NOT EXISTS "buyer_request_offers_sellerId_idx"  ON "buyer_request_offers"("sellerId");
CREATE INDEX IF NOT EXISTS "buyer_request_offers_status_idx"    ON "buyer_request_offers"("status");

-- legal_pages
CREATE TABLE IF NOT EXISTS "legal_pages" (
  "id"          TEXT NOT NULL,
  "pageType"    TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "content"     TEXT NOT NULL,
  "version"     TEXT NOT NULL DEFAULT '1.0',
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "legal_pages_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  CREATE UNIQUE INDEX "legal_pages_pageType_key" ON "legal_pages"("pageType");
EXCEPTION WHEN duplicate_table THEN null; END $$;
CREATE INDEX IF NOT EXISTS "legal_pages_pageType_isPublished_idx" ON "legal_pages"("pageType", "isPublished");

-- live_chats
CREATE TABLE IF NOT EXISTS "live_chats" (
  "id"           TEXT NOT NULL,
  "visitorId"    TEXT NOT NULL,
  "visitorName"  TEXT,
  "visitorEmail" TEXT,
  "status"       "LiveChatStatus" NOT NULL DEFAULT 'OPEN',
  "subject"      TEXT,
  "assignedTo"   TEXT,
  "resolvedAt"   TIMESTAMP(3),
  "closedAt"     TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "live_chats_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "live_chats_status_idx"    ON "live_chats"("status");
CREATE INDEX IF NOT EXISTS "live_chats_visitorId_idx" ON "live_chats"("visitorId");
CREATE INDEX IF NOT EXISTS "live_chats_createdAt_idx" ON "live_chats"("createdAt");

-- live_chat_messages
CREATE TABLE IF NOT EXISTS "live_chat_messages" (
  "id"         TEXT NOT NULL,
  "chatId"     TEXT NOT NULL,
  "senderType" TEXT NOT NULL,
  "content"    TEXT NOT NULL,
  "isRead"     BOOLEAN NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "live_chat_messages_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "live_chat_messages"
    ADD CONSTRAINT "live_chat_messages_chatId_fkey"
    FOREIGN KEY ("chatId") REFERENCES "live_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE INDEX IF NOT EXISTS "live_chat_messages_chatId_createdAt_idx" ON "live_chat_messages"("chatId", "createdAt");
