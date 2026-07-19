# Velxo P2P Overhaul — Progress Tracker

## Scope
Full overhaul of: Order Tracking · Order Page · Payment Flow · Checkout ·
Seller Profile · Escrow System · Escrow Progression · Buyer-Seller Communication ·
Seller Levels (BRONZE/SILVER/GOLD/ELITE) · Response Time · Delivery Speed ·
Product Page · UI/Design/Theme upgrade

## Rules
- No data loss — no schema column drops, only additive migrations
- Only this one md file

---

## Status Key
- [ ] Not started
- [x] Done
- [~] In progress

---

## BACKEND

### 1. Seller Level System
- [x] Add `sellerLevel` enum (BRONZE/SILVER/GOLD/ELITE) to `sellers` table via migration
- [x] Add `avgResponseTimeHours` computed field + `deliverySuccessRate` to `sellers`
- [x] `SellersService.computeSellerLevel()` — auto-assign based on sales/rating
- [x] Hook `computeSellerLevel()` into `updateSellerStats()` (sellers.service.ts:610)
- [x] `SellersService.getSellerProfile()` includes `sellerLevel`, `avgResponseTimeHours`, `deliverySuccessRate` (sellers.service.ts:196-198)
- [x] Expose seller level on `/sellers/:id` (`@Get(':id')`) and `/sellers/me` (`@Get('me')`) controller routes

### 2. Response Time Tracking
- [x] Add `lastSeenAt` to `users` via migration (additive) — present in schema.prisma:175
- [x] Track response time on new message creation in MessagesService (`updateSellerResponseTime` wired in `sendMessage`, messages.service.ts:230)
- [x] Recalculate `responseTime` on seller profile (rolling avg, messages.service.ts:337-371)

### 3. Orders — Extended
- [x] `GET /orders/seller` (seller view with buyer info) — `OrdersController.@Get('seller')` → `getSellerOrdersByUserId`
- [x] Add `deliverySpeedMinutes` metric (acceptedAt → deliveredAt delta) to order serialization — `orders.service.ts` `getOrderById`
- [x] Add order timeline events — `getOrderTimeline()` + `GET /orders/:id/timeline` (authorizes buyer/seller)

### 4. Checkout / Payment endpoint improvements
- [x] Re-check availability atomically before order creation (inside `$transaction` in `createOrder`)
- [x] Return enriched order+escrow object from `POST /orders` (includes `escrow`, `orderItems`, `buyer`, `seller`)

### 5. Notifications
- [x] Notify buyer of seller response when seller sends first message in new order — `notifySellerFirstResponse` wired in `messages.service.sendMessage`
- [x] Notify buyer when close to confirm deadline — `notifyBuyerNearDeadline` (setTimeout 15min before `buyerConfirmDeadline`) wired in `orders.service.markDelivered`

---

## FRONTEND

### 6. Design System / Theme
- [x] Add seller level color tokens to tailwind config (bronze/silver/gold/elite) — tailwind.config.ts:35-38
- [x] `SellerLevelBadge` component with animated gradient for each tier + `SellerLevelProgress`
- [x] Glassmorphism card variant utility classes in globals.css (`.glass`, `.glass-strong`, `.glass-brand`, `.glass-hover`)

### 7. Product / Listing Page
- [x] Upgrade `listing-details-content.tsx` — rich info layout, seller level badge, response time, delivery speed, Buy Now, seller mini-profile + message CTA

### 8. Checkout Page (new)
- [x] `/checkout/[listingId]/checkout-content.tsx` — full checkout flow, payment method selector, order summary fee breakdown, escrow explanation

### 9. Order Tracking Page
- [x] P2P timeline, live countdown, delivery reveal (tabbed), integrated chat, seller info card — order-tracking-content.tsx
- [x] Real "Order Activity" timeline (from `/orders/:id/timeline`) + tabbed delivery reveal (Credentials/Notes/Raw) — order-tracking-content.tsx

### 10. Orders List Page
- [x] Redesign `/orders/page.tsx` — richer cards, delivery speed, filter/search

### 11. Escrow Progression UI
- [x] Stepper with steps + fee breakdown + seller levels/milestone section — escrow/page.tsx

### 12. Seller Profile Page
- [x] `seller-profile-content.tsx` — cover banner, avatar, level badge, stats grid, listing grid, reviews w/ distribution

### 13. Buyer-Seller Communication
- [x] messages page — per-day dividers, read receipts (CheckCheck), quick replies, order context card

### 14. Seller Dashboard
- [x] `seller/dashboard/page.tsx` — level progress card (SellerLevelProgress), response rate/delivery KPI, active order urgency banner

---

## MIGRATIONS (additive only — no drops)
- [x] `seller_level` enum + `sellerLevel` column on `sellers` — in schema.prisma:212,237
- [x] `avg_response_time_hours` Float — schema.prisma:244
- [x] `delivery_success_rate` Float — schema.prisma:245
- [x] `last_seen_at` on `users` — schema.prisma:175
- [x] Prisma schema sync (additive fields only) — `add_seller_levels` migration folder present (untracked)
- [~] Run `prisma migrate deploy` / `db push` to apply to DB — NOT run by this agent (data-safety rule)

---

## Completed Items Log
*(append here as tasks finish)*

### 2026-07-19 (verification agent)
- Verified BACKEND 1 (seller levels): `computeSellerLevel` (sellers.service.ts:13), hooked in `updateSellerStats` (:610); `getSellerProfile` returns `sellerLevel`/`avgResponseTimeHours`/`deliverySuccessRate` (:196-198); controller `@Get('me')` (:55) and `@Get(':id')` (:88) expose profile.
- Verified BACKEND 2 (response time): `updateSellerResponseTime` wired in `sendMessage` (messages.service.ts:230); rolling-average recompute (:337-371); `users.lastSeenAt` in schema.
- Verified FRONTEND 6/7/8/10/11/12/13/14: SellerLevelBadge + tokens, listing page, checkout, orders list, escrow, seller profile, messages, dashboard all present and feature-complete.
- Verified schema migrations additive fields present; `add_seller_levels` migration folder exists (untracked) — DB apply deferred (data-safety).
- FIXED type error: `seller/dashboard/page.tsx` had orphaned interface block (lines 40-44, no declaration) — removed duplicate; frontend `tsc --noEmit` now clean.

### 2026-07-19 (parallel agents — all verified present)
- BACKEND 3: added `getOrderTimeline()` + `deliverySpeedMinutes` in `orders.service.ts`; added `GET /orders/:id/timeline` (authorizes buyer/seller) in `orders.controller.ts` (before `@Get(':id')`).
- BACKEND 5: added `notifySellerFirstResponse` + `notifyBuyerNearDeadline` in `notifications.service.ts`; wired first into `messages.service.sendMessage` (first seller reply in order convo), second into `orders.service.markDelivered` via 15-min-before-deadline setTimeout.
- FRONTEND 6: added `.glass`/`.glass-strong`/`.glass-brand`/`.glass-hover` to globals.css; layered glass onto listing purchase card + checkout cards.
- FRONTEND 9: added real "Order Activity" timeline (fetched from `/orders/:id/timeline`) + 3-tabbed delivery reveal (Credentials/Notes/Raw) in `order-tracking-content.tsx`.

### Remaining (not done — out of scope / pre-existing)
- BACKEND `sellers.controller.ts:112` type compare + `upload/storage.service.ts` missing `@aws-sdk/client-s3` are pre-existing, unrelated to this overhaul.
- DB migration application (`prisma migrate deploy`) intentionally NOT run (data-safety rule — deploy pipeline applies it).
