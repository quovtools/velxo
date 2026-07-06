-- ============================================================
-- VELXO DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- ENUMS
CREATE TYPE "Role" AS ENUM ('BUYER', 'SELLER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'SOLD', 'EXPIRED');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'DISPUTED');
CREATE TYPE "EscrowStatus" AS ENUM ('HELD', 'RELEASED', 'REFUNDED', 'DISPUTED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE "PaymentProvider" AS ENUM ('FLUTTERWAVE', 'PAYMENT_IO', 'CRYPTO');
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'FAILED');
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_BUYER', 'RESOLVED_SELLER', 'RESOLVED_PLATFORM', 'CLOSED');
CREATE TYPE "DisputeResolutionType" AS ENUM ('REFUND_BUYER', 'RELEASE_TO_SELLER', 'SPLIT', 'OTHER');
CREATE TYPE "MessageSenderType" AS ENUM ('BUYER', 'SELLER', 'ADMIN', 'SUPPORT', 'SYSTEM');
CREATE TYPE "NotificationType" AS ENUM ('ORDER_STATUS', 'MESSAGE', 'DISPUTE', 'WITHDRAWAL', 'LISTING_APPROVED', 'LISTING_REJECTED', 'FRAUD_ALERT', 'SYSTEM');
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE "SupportTicketCategory" AS ENUM ('PAYMENT', 'DELIVERY', 'ACCOUNT', 'DISPUTE', 'OTHER');
CREATE TYPE "FraudFlagType" AS ENUM ('SUSPICIOUS_LOGIN', 'RAPID_ORDERS', 'HIGH_VALUE_TRANSACTION', 'MULTIPLE_ACCOUNTS', 'CHARGEBACK_RISK', 'MANUAL_REVIEW');
CREATE TYPE "FraudFlagSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'PAYMENT', 'REFUND', 'ESCROW_RELEASE', 'WITHDRAWAL', 'ROLE_CHANGE', 'VERIFICATION_CHANGE');
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'PAID');

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email            TEXT UNIQUE NOT NULL,
  "emailVerified"  BOOLEAN NOT NULL DEFAULT false,
  phone            TEXT,
  "phoneVerified"  BOOLEAN NOT NULL DEFAULT false,
  "passwordHash"   TEXT,
  "firstName"      TEXT,
  "lastName"       TEXT,
  "avatarUrl"      TEXT,
  role             "Role" NOT NULL DEFAULT 'BUYER',
  "isActive"       BOOLEAN NOT NULL DEFAULT true,
  "isBanned"       BOOLEAN NOT NULL DEFAULT false,
  "banReason"      TEXT,
  "lastLoginAt"    TIMESTAMPTZ,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deletedAt"      TIMESTAMPTZ
);

CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_role_idx ON users(role);
CREATE INDEX users_created_idx ON users("createdAt");

-- ============================================================
-- SELLERS
-- ============================================================
CREATE TABLE sellers (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"              TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "storeName"           TEXT NOT NULL,
  "storeDescription"    TEXT,
  "isVerified"          BOOLEAN NOT NULL DEFAULT false,
  "verificationDocuments" JSONB,
  "reputationScore"     FLOAT NOT NULL DEFAULT 0.0,
  "totalSales"          INT NOT NULL DEFAULT 0,
  "totalRevenue"        DECIMAL(12,2) NOT NULL DEFAULT 0,
  "averageRating"       FLOAT NOT NULL DEFAULT 0.0,
  "responseRate"        FLOAT NOT NULL DEFAULT 0.0,
  "responseTime"        INT,
  "subscriptionTier"    TEXT NOT NULL DEFAULT 'FREE',
  "subscriptionEndsAt"  TIMESTAMPTZ,
  "featuredUntil"       TIMESTAMPTZ,
  "isSuspended"         BOOLEAN NOT NULL DEFAULT false,
  "suspensionReason"    TEXT,
  "verifiedAt"          TIMESTAMPTZ,
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX sellers_user_idx ON sellers("userId");
CREATE INDEX sellers_verified_idx ON sellers("isVerified");
CREATE INDEX sellers_reputation_idx ON sellers("reputationScore");
CREATE INDEX sellers_sales_idx ON sellers("totalSales");

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT UNIQUE NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  icon        TEXT,
  "imageUrl"  TEXT,
  "sortOrder" INT NOT NULL DEFAULT 0,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX categories_slug_idx ON categories(slug);
CREATE INDEX categories_sort_idx ON categories("sortOrder");

-- ============================================================
-- SUBCATEGORIES
-- ============================================================
CREATE TABLE subcategories (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "categoryId" TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL,
  description  TEXT,
  icon         TEXT,
  "sortOrder"  INT NOT NULL DEFAULT 0,
  "isActive"   BOOLEAN NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("categoryId", slug)
);

CREATE INDEX subcategories_category_idx ON subcategories("categoryId");

-- ============================================================
-- LISTINGS
-- ============================================================
CREATE TABLE listings (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sellerId"       TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  "categoryId"     TEXT NOT NULL REFERENCES categories(id),
  "subcategoryId"  TEXT REFERENCES subcategories(id),
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  price            DECIMAL(12,2) NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'USD',
  "gameId"         TEXT,
  "gameName"       TEXT NOT NULL,
  sku              TEXT,
  status           "ListingStatus" NOT NULL DEFAULT 'DRAFT',
  rank             TEXT,
  level            INT,
  skins            JSONB,
  inventory        JSONB,
  "linkedAccounts" JSONB,
  "loginMethod"    TEXT,
  region           TEXT,
  platform         TEXT,
  "playerId"       TEXT,
  "playerUid"      TEXT,
  "deliveryTime"   INT,
  images           TEXT[] NOT NULL DEFAULT '{}',
  videos           TEXT[] NOT NULL DEFAULT '{}',
  screenshots      TEXT[] NOT NULL DEFAULT '{}',
  "isFeatured"     BOOLEAN NOT NULL DEFAULT false,
  "isSponsored"    BOOLEAN NOT NULL DEFAULT false,
  "isSold"         BOOLEAN NOT NULL DEFAULT false,
  "viewCount"      INT NOT NULL DEFAULT 0,
  "salesCount"     INT NOT NULL DEFAULT 0,
  "moderationNotes" TEXT,
  "moderatedAt"    TIMESTAMPTZ,
  "moderatedBy"    TEXT,
  "searchVector"   tsvector,
  metadata         JSONB,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "expiresAt"      TIMESTAMPTZ
);

CREATE INDEX listings_seller_idx ON listings("sellerId");
CREATE INDEX listings_category_idx ON listings("categoryId");
CREATE INDEX listings_subcategory_idx ON listings("subcategoryId");
CREATE INDEX listings_status_idx ON listings(status);
CREATE INDEX listings_price_idx ON listings(price);
CREATE INDEX listings_game_idx ON listings("gameName");
CREATE INDEX listings_region_idx ON listings(region);
CREATE INDEX listings_platform_idx ON listings(platform);
CREATE INDEX listings_featured_idx ON listings("isFeatured");
CREATE INDEX listings_created_idx ON listings("createdAt");

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderNumber"    TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  "buyerId"        TEXT NOT NULL REFERENCES users(id),
  "sellerId"       TEXT NOT NULL REFERENCES users(id),
  status           "OrderStatus" NOT NULL DEFAULT 'PENDING',
  subtotal         DECIMAL(12,2) NOT NULL,
  "taxAmount"      DECIMAL(12,2) NOT NULL DEFAULT 0,
  "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "totalAmount"    DECIMAL(12,2) NOT NULL,
  "commissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0.10,
  "commissionAmount" DECIMAL(12,2) NOT NULL,
  "sellerPayout"   DECIMAL(12,2) NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'USD',
  "buyerNote"      TEXT,
  "sellerNote"     TEXT,
  "deliveryData"   JSONB,
  "paidAt"         TIMESTAMPTZ,
  "deliveredAt"    TIMESTAMPTZ,
  "completedAt"    TIMESTAMPTZ,
  "cancelledAt"    TIMESTAMPTZ,
  "refundedAt"     TIMESTAMPTZ,
  metadata         JSONB,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX orders_buyer_idx ON orders("buyerId");
CREATE INDEX orders_seller_idx ON orders("sellerId");
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_number_idx ON orders("orderNumber");
CREATE INDEX orders_created_idx ON orders("createdAt");

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId"    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  "listingId"  TEXT NOT NULL REFERENCES listings(id),
  quantity     INT NOT NULL DEFAULT 1,
  "unitPrice"  DECIMAL(12,2) NOT NULL,
  "totalPrice" DECIMAL(12,2) NOT NULL,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX order_items_order_idx ON order_items("orderId");
CREATE INDEX order_items_listing_idx ON order_items("listingId");

-- ============================================================
-- ESCROW TRANSACTIONS
-- ============================================================
CREATE TABLE escrow_transactions (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId"    TEXT UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status       "EscrowStatus" NOT NULL DEFAULT 'HELD',
  amount       DECIMAL(12,2) NOT NULL,
  currency     TEXT NOT NULL DEFAULT 'USD',
  "releasedAt" TIMESTAMPTZ,
  "refundedAt" TIMESTAMPTZ,
  "disputedAt" TIMESTAMPTZ,
  metadata     JSONB,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX escrow_status_idx ON escrow_transactions(status);
CREATE INDEX escrow_created_idx ON escrow_transactions("createdAt");

-- ============================================================
-- WALLETS
-- ============================================================
CREATE TABLE wallets (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"        TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance         DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  "lockedBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "totalEarnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "totalWithdrawn" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX wallets_user_idx ON wallets("userId");

-- ============================================================
-- WALLET TRANSACTIONS
-- ============================================================
CREATE TABLE wallet_transactions (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "walletId"     TEXT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type           TEXT NOT NULL,
  amount         DECIMAL(12,2) NOT NULL,
  currency       TEXT NOT NULL DEFAULT 'USD',
  "balanceAfter" DECIMAL(12,2) NOT NULL,
  description    TEXT NOT NULL,
  "relatedId"    TEXT,
  metadata       JSONB,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX wallet_tx_wallet_idx ON wallet_transactions("walletId");
CREATE INDEX wallet_tx_created_idx ON wallet_transactions("createdAt");

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId"           TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  "listingId"         TEXT NOT NULL REFERENCES listings(id),
  "buyerId"           TEXT NOT NULL REFERENCES users(id),
  "sellerId"          TEXT NOT NULL REFERENCES users(id),
  rating              INT NOT NULL,
  comment             TEXT NOT NULL,
  "isEdited"          BOOLEAN NOT NULL DEFAULT false,
  "isHidden"          BOOLEAN NOT NULL DEFAULT false,
  "helpfulCount"      INT NOT NULL DEFAULT 0,
  "sellerResponse"    TEXT,
  "sellerRespondedAt" TIMESTAMPTZ,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX reviews_seller_idx ON reviews("sellerId");
CREATE INDEX reviews_listing_idx ON reviews("listingId");
CREATE INDEX reviews_rating_idx ON reviews(rating);
CREATE INDEX reviews_created_idx ON reviews("createdAt");

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE conversations (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "buyerId"       TEXT NOT NULL,
  "sellerId"      TEXT NOT NULL,
  "orderId"       TEXT,
  "isBlocked"     BOOLEAN NOT NULL DEFAULT false,
  "lastMessageAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX conversations_buyer_seller_idx ON conversations("buyerId", "sellerId");

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE messages (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "conversationId" TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  "senderId"       TEXT NOT NULL REFERENCES users(id),
  "senderType"     "MessageSenderType" NOT NULL DEFAULT 'BUYER',
  content          TEXT NOT NULL,
  attachments      TEXT[] NOT NULL DEFAULT '{}',
  "isRead"         BOOLEAN NOT NULL DEFAULT false,
  "readAt"         TIMESTAMPTZ,
  "isDeleted"      BOOLEAN NOT NULL DEFAULT false,
  metadata         JSONB,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX messages_conversation_idx ON messages("conversationId");
CREATE INDEX messages_sender_idx ON messages("senderId");
CREATE INDEX messages_read_idx ON messages("isRead");
CREATE INDEX messages_created_idx ON messages("createdAt");

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type      "NotificationType" NOT NULL,
  title     TEXT NOT NULL,
  body      TEXT NOT NULL,
  data      JSONB,
  "isRead"  BOOLEAN NOT NULL DEFAULT false,
  "readAt"  TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_read_idx ON notifications("userId", "isRead");
CREATE INDEX notifications_created_idx ON notifications("createdAt");

-- ============================================================
-- DISPUTES
-- ============================================================
CREATE TABLE disputes (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId"         TEXT NOT NULL REFERENCES orders(id),
  "initiatedById"   TEXT NOT NULL REFERENCES users(id),
  status            "DisputeStatus" NOT NULL DEFAULT 'OPEN',
  reason            TEXT NOT NULL,
  evidence          JSONB,
  "resolutionType"  "DisputeResolutionType",
  "resolutionNotes" TEXT,
  "refundAmount"    DECIMAL(12,2),
  "resolvedBy"      TEXT REFERENCES users(id),
  "resolvedAt"      TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX disputes_order_idx ON disputes("orderId");
CREATE INDEX disputes_status_idx ON disputes(status);
CREATE INDEX disputes_created_idx ON disputes("createdAt");

-- ============================================================
-- DISPUTE MESSAGES
-- ============================================================
CREATE TABLE dispute_messages (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "disputeId"  TEXT NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  "senderId"   TEXT NOT NULL,
  content      TEXT NOT NULL,
  attachments  TEXT[] NOT NULL DEFAULT '{}',
  "isSystem"   BOOLEAN NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX dispute_messages_dispute_idx ON dispute_messages("disputeId");

-- ============================================================
-- SUPPORT TICKETS
-- ============================================================
CREATE TABLE support_tickets (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"     TEXT NOT NULL REFERENCES users(id),
  subject      TEXT NOT NULL,
  category     "SupportTicketCategory" NOT NULL,
  priority     TEXT NOT NULL DEFAULT 'MEDIUM',
  status       "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
  "assigneeId" TEXT,
  tags         TEXT[] NOT NULL DEFAULT '{}',
  metadata     JSONB,
  "closedAt"   TIMESTAMPTZ,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX support_tickets_user_idx ON support_tickets("userId");
CREATE INDEX support_tickets_status_idx ON support_tickets(status);
CREATE INDEX support_tickets_priority_idx ON support_tickets(priority);

-- ============================================================
-- ADMIN AUDIT LOGS
-- ============================================================
CREATE TABLE admin_audit_logs (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "actorId"    TEXT NOT NULL REFERENCES users(id),
  action       "AuditAction" NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId"   TEXT NOT NULL,
  "oldValue"   JSONB,
  "newValue"   JSONB,
  "ipAddress"  TEXT,
  "userAgent"  TEXT,
  metadata     JSONB,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audit_actor_idx ON admin_audit_logs("actorId");
CREATE INDEX audit_entity_idx ON admin_audit_logs("entityType", "entityId");
CREATE INDEX audit_action_idx ON admin_audit_logs(action);
CREATE INDEX audit_created_idx ON admin_audit_logs("createdAt");

-- ============================================================
-- FRAUD FLAGS
-- ============================================================
CREATE TABLE fraud_flags (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"     TEXT NOT NULL REFERENCES users(id),
  "listingId"  TEXT REFERENCES listings(id),
  "orderId"    TEXT REFERENCES orders(id),
  type         "FraudFlagType" NOT NULL,
  severity     "FraudFlagSeverity" NOT NULL,
  status       TEXT NOT NULL DEFAULT 'OPEN',
  score        FLOAT,
  details      JSONB,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMPTZ,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX fraud_flags_user_idx ON fraud_flags("userId");
CREATE INDEX fraud_flags_status_idx ON fraud_flags(status);
CREATE INDEX fraud_flags_severity_idx ON fraud_flags(severity);
CREATE INDEX fraud_flags_created_idx ON fraud_flags("createdAt");

-- ============================================================
-- PAYMENT METHODS
-- ============================================================
CREATE TABLE payment_methods (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider    "PaymentProvider" NOT NULL,
  type        TEXT NOT NULL,
  last4       TEXT,
  brand       TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  metadata    JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX payment_methods_user_idx ON payment_methods("userId");

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId"               TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  "methodId"              TEXT REFERENCES payment_methods(id),
  provider                "PaymentProvider" NOT NULL,
  status                  "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  amount                  DECIMAL(12,2) NOT NULL,
  currency                TEXT NOT NULL DEFAULT 'USD',
  "providerTransactionId" TEXT,
  metadata                JSONB,
  "errorMessage"          TEXT,
  "paidAt"                TIMESTAMPTZ,
  "refundedAt"            TIMESTAMPTZ,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX payments_order_idx ON payments("orderId");
CREATE INDEX payments_status_idx ON payments(status);
CREATE INDEX payments_provider_tx_idx ON payments("providerTransactionId");

-- ============================================================
-- WITHDRAWAL REQUESTS
-- ============================================================
CREATE TABLE withdrawal_requests (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sellerId"    TEXT NOT NULL REFERENCES sellers(id),
  amount        DECIMAL(12,2) NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'USD',
  status        "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
  method        TEXT NOT NULL,
  destination   JSONB NOT NULL,
  fee           DECIMAL(12,2) NOT NULL DEFAULT 0,
  "netAmount"   DECIMAL(12,2) NOT NULL,
  "processedBy" TEXT,
  notes         TEXT,
  "completedAt" TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX withdrawals_seller_idx ON withdrawal_requests("sellerId");
CREATE INDEX withdrawals_status_idx ON withdrawal_requests(status);
CREATE INDEX withdrawals_created_idx ON withdrawal_requests("createdAt");

-- ============================================================
-- COMMISSIONS
-- ============================================================
CREATE TABLE commissions (
  id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId"  TEXT NOT NULL REFERENCES orders(id),
  "sellerId" TEXT NOT NULL REFERENCES sellers(id),
  rate       DECIMAL(5,4) NOT NULL,
  amount     DECIMAL(12,2) NOT NULL,
  currency   TEXT NOT NULL DEFAULT 'USD',
  status     "CommissionStatus" NOT NULL DEFAULT 'PENDING',
  "paidAt"   TIMESTAMPTZ,
  "dueAt"    TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX commissions_seller_status_idx ON commissions("sellerId", status);

-- ============================================================
-- GAME SLIDES
-- ============================================================
CREATE TABLE game_slides (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title       TEXT NOT NULL,
  subtitle    TEXT,
  "imageUrl"  TEXT NOT NULL,
  "linkHref"  TEXT,
  badge       TEXT,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX game_slides_active_sort_idx ON game_slides("isActive", "sortOrder");

-- ============================================================
-- AUTO-UPDATE updatedAt via trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER sellers_updated_at BEFORE UPDATE ON sellers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subcategories_updated_at BEFORE UPDATE ON subcategories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER escrow_updated_at BEFORE UPDATE ON escrow_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER withdrawal_requests_updated_at BEFORE UPDATE ON withdrawal_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER game_slides_updated_at BEFORE UPDATE ON game_slides FOR EACH ROW EXECUTE FUNCTION update_updated_at();
