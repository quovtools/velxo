# User Features & Transactions Improvement Spec

**Project:** Piyrox Marketplace (Velxo)  
**Date:** 2026-07-31  
**Scope:** Full-stack — NestJS backend + Next.js 14 App Router frontend  
**Status:** Draft

---

## Overview

This spec covers 11 improvement areas across the user-facing and transaction layers of the Piyrox gaming marketplace. Each section documents the current state, what needs to change, precise technical requirements, and acceptance criteria.

---

## Table of Contents

1. [Full-Stack KYC Upgrade](#1-full-stack-kyc-upgrade)
2. [Wallet Top-Up, Messaging UI & Flow](#2-wallet-top-up-messaging-ui--flow)
3. [Order Management](#3-order-management)
4. [Improved Trust-Trade Escrow System](#4-improved-trust-trade-escrow-system)
5. [Auto Pricing Suggestion (AI)](#5-auto-pricing-suggestion-ai)
6. [Game-Specific Listing Templates](#6-game-specific-listing-templates)
7. [Push Notifications](#7-push-notifications)
8. [Improved Trust Badge System](#8-improved-trust-badge-system)
9. [Advanced Search & Filter](#9-advanced-search--filter)
10. [Auth Error Handling — Auto Re-login on Invalid Token](#10-auth-error-handling--auto-re-login-on-invalid-token)
11. [Payment Flow & Login/Sign-Up Page Redesign](#11-payment-flow--loginsign-up-page-redesign)

---

---

## 1. Full-Stack KYC Upgrade

### Current State

The `sellers` table has KYC fields (`kycStatus`, `kycIdType`, `kycIdImageUrl`, `kycSelfieImageUrl`, `kycDocumentNumber`, `kycFullName`, `kycSubmittedAt`, `kycReviewedAt`, `kycRejectionReason`). The backend has `submitKyc`, `approveKyc`, and `rejectKyc` endpoints in `sellers.service.ts`. There is no dedicated frontend KYC wizard — users have no guided flow to complete verification, and the existing form (if any) is buried inside the seller dashboard without clear steps or status feedback.

KYC is only enforced for sellers. Buyers can transact without any identity verification, which creates fraud risk on high-value orders.

### Goals

- Multi-step guided KYC wizard for sellers (and optionally buyers above a spend threshold).
- In-browser document capture with camera support (existing `CameraCapture.tsx` component can be reused).
- Admin review queue with approve/reject actions and rejection reason messaging.
- KYC status clearly communicated to the user at every stage (submitted, under review, approved, rejected + reason).
- KYC gate for listing creation — a seller cannot publish listings until KYC is `APPROVED`.

### Backend Requirements

**Schema — no changes required.** All required fields exist on `sellers`.

**New/modified endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sellers/kyc/submit` | Submit KYC. Accepts multipart form data: `idType`, `fullName`, `documentNumber`, `idImage` (file), `selfieImage` (file). Validates file type (JPEG/PNG/PDF, max 5 MB each). Stores files to object storage (Supabase Storage or existing provider). Updates `kycStatus → SUBMITTED`. |
| `GET` | `/sellers/kyc/status` | Returns current `kycStatus`, `kycSubmittedAt`, `kycRejectionReason`, `isVerified` for the authenticated seller. |
| `PATCH` | `/admin/sellers/:id/kyc/approve` | Admin: sets `kycStatus → APPROVED`, `isVerified → true`, `verifiedAt → now()`. Sends `KYC_APPROVED` notification. |
| `PATCH` | `/admin/sellers/:id/kyc/reject` | Admin: sets `kycStatus → REJECTED`, `kycRejectionReason`. Sends `KYC_REJECTED` notification with reason. |

**Guards:**  
- `ListingsController.createListing` must check `seller.kycStatus === 'APPROVED'` before allowing listing creation. Return `403 Forbidden` with message `"Complete KYC verification before listing items"` if not approved.

**File upload:**  
Use `@nestjs/platform-express` `multer` for file handling. Store files to the existing Supabase Storage bucket (path: `kyc/{sellerId}/{timestamp}_{field}.jpg`). Return the public URL and persist it to `kycIdImageUrl` / `kycSelfieImageUrl`.

### Frontend Requirements

**New page:** `frontend/src/app/seller/kyc/page.tsx`

**Step flow (wizard):**

```
Step 1: Identity Type Selection
  → Choose: National ID | Passport | Driver's License | BVN (Nigeria)

Step 2: Personal Details
  → Full legal name, document number
  → Validation against backend schema

Step 3: Document Upload
  → Front of ID (file picker + camera via CameraCapture.tsx)
  → Preview with re-take option

Step 4: Selfie / Liveness
  → Selfie holding the ID document
  → Camera capture preferred, file upload fallback

Step 5: Review & Submit
  → Show all entered data and image previews
  → Submit button → POST /sellers/kyc/submit

Step 6: Status Page
  → Pending: "Under review — usually 24 hours"
  → Approved: green checkmark, link to start listing
  → Rejected: red banner with rejection reason + re-submit button
```

**KYC status banner** — add to seller dashboard header and listing creation page when `kycStatus !== 'APPROVED'`:
- `NOT_SUBMITTED` → amber banner: "Verify your identity to start selling → [Start KYC]"
- `SUBMITTED` → blue banner: "KYC under review — we'll notify you within 24 hours"
- `REJECTED` → red banner: "KYC rejected: {reason} → [Re-submit]"

**Admin KYC queue** — add to `frontend/src/app/admin/` a new page `kyc-review/page.tsx`:
- Table of `SUBMITTED` KYC applications with seller name, date, document type.
- Click to open modal: shows uploaded ID image, selfie, personal details.
- Approve / Reject (with required reason) buttons.

### Acceptance Criteria

- [ ] Seller can complete a 5-step KYC wizard, upload documents, and submit.
- [ ] `kycStatus` transitions correctly: `NOT_SUBMITTED → SUBMITTED → APPROVED | REJECTED`.
- [ ] Seller with `kycStatus !== 'APPROVED'` receives a 403 when trying to create a listing.
- [ ] Approved seller receives an in-app notification and their `VerifiedBadge` appears on their store.
- [ ] Rejected seller sees the rejection reason and can re-submit.
- [ ] Admin can view a queue of pending KYC applications and approve or reject each with a reason.
- [ ] File uploads are validated (type, size) before sending and stored securely with no public listing of all KYC files.

---

## 2. Wallet Top-Up, Messaging UI & Flow

### 2A — Wallet Top-Up

#### Current State

The wallet page (`frontend/src/app/wallet/page.tsx`) shows balance, locked balance, earnings, and withdrawal history. There is no way for a **buyer** to deposit money into their wallet. The only wallet credit path is via escrow release (sellers) or refunds. Top-up products exist in the DB (`topupProducts` model) but are for game currency delivery, not wallet deposits.

Buyers currently pay directly at checkout via a hosted payment link (Flutterwave / Paymento). Adding a wallet top-up flow unlocks faster repeat purchases and reduces friction.

#### Backend Requirements

**New endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/wallet/topup/initiate` | Body: `{ amount: number, currency: string, provider: 'FLUTTERWAVE' \| 'PAYMENT_IO' }`. Creates a pending `walletTransactions` record (type `HOLD`, description `"Wallet top-up pending"`). Calls the payment provider to create a hosted charge. Returns `{ paymentUrl, topupId }`. |
| `POST` | `/wallet/topup/webhook` | Webhook from Flutterwave / Paymento confirming top-up payment. Verifies HMAC signature. On success: sets transaction type to `CREDIT`, increments `wallet.balance`, returns 200. |
| `GET` | `/wallet/topup/status/:topupId` | Polls the status of a pending top-up (for redirect-back fallback). |

**Wallet transaction types** — add `TOPUP` to the type string set (existing code uses a plain string, so this is additive).

**Minimum top-up:** $1 / equivalent. Maximum: $500 per transaction (configurable via env `WALLET_TOPUP_MAX_USD`).

#### Frontend Requirements

**Wallet page additions:**

- Add a `+ Add Funds` button next to the existing `Withdraw` button in the wallet header.
- Opens a modal with:
  - Amount input (preset quick-select: $5, $10, $25, $50, $100, custom)
  - Currency display (based on `useCurrency` hook, auto-converts)
  - Payment method selector: Flutterwave (card/mobile money) | Paymento (crypto)
  - `Add Funds` button → calls `POST /wallet/topup/initiate` → redirects to hosted payment URL
- After returning from payment provider, the `/wallet` page polls `GET /wallet/topup/status/:topupId` every 3 seconds for up to 60 seconds, then shows success/failure banner.
- Top-up transactions must appear in the transaction history list with type label `Deposit`.

**`TYPE_CONFIG` update** in `wallet/page.tsx`:
```ts
TOPUP: { color: 'text-sky-400', bg: 'bg-sky-900/20 border-sky-500/20', label: 'Deposit', sign: '+' },
```

**Checkout integration:** When a buyer has sufficient wallet balance at checkout, offer a `Pay from Wallet` option alongside the existing hosted payment link. Deducts from wallet instead of initiating an external payment flow.

---

### 2B — Messaging UI & Flow

#### Current State

`frontend/src/app/messages/page.tsx` has a solid foundation: Socket.io real-time, conversation sidebar, message grouping by day, read receipts, quick replies, send/receive. Missing features that are standard in a marketplace chat:

- No typing indicators
- No image/file attachment support
- No order-context summary panel within the chat
- No emoji picker
- The "Online" status is hardcoded to always show green `Online` — not connected to real `lastSeenAt`
- No message reactions
- No ability to share a listing within chat (seller can't recommend another item)

#### Backend Requirements

**Typing indicators** (Socket.io only, no DB persistence):
- Client emits `typing` event with `{ conversationId }` to the `/messages` gateway.
- Gateway broadcasts `userTyping: { userId, conversationId }` to the other participant.
- Client stops emitting after 2 seconds of no keystroke.

**File/image attachments:**
- New endpoint `POST /messages/conversation/:id/upload` (multipart, max 5 MB, image/video/PDF).
- Stores file to object storage, returns `{ url, mimeType, fileName }`.
- The main `send` endpoint already accepts `content`; add optional `attachmentUrl`, `attachmentType`, `attachmentName` fields to the `messages` model via Prisma migration.
- Existing `messages` model:

```prisma
// Add to messages model
attachmentUrl   String?
attachmentType  String?  // image | video | file
attachmentName  String?
```

**Online/last-seen:**
- Existing `lastSeenAt` field on `users` is updated on each API call via a middleware or on socket connect/disconnect events.
- The messages gateway should update `lastSeenAt` on socket connect and emit `userOnlineStatus` events.

**Listing share in chat:**
- Allow `content` to include a structured payload `{ type: 'LISTING_SHARE', listingId }`.
- Frontend renders as a mini listing card instead of plain text.

#### Frontend Requirements

**Typing indicator:**
- Show `"[Name] is typing..."` in a pill below the last message when the socket receives `userTyping` for the active conversation.
- Auto-hide after 3 seconds.

**Emoji picker:**
- Add emoji button to the input bar. On click, opens a small emoji grid (use `emoji-picker-react` or a lightweight custom grid of the 64 most common emojis to avoid a heavy dependency).
- Clicking an emoji appends it to the current draft message.

**Image/file attachments:**
- Repurpose the existing `Paperclip` button (currently opens quick replies) to open a choice: `Quick Replies | Attach Image | Share Listing`.
- `Attach Image`: file input accepts `image/*`, uploads to `/messages/conversation/:id/upload`, inserts attachment URL into the message.
- Images render inline (max 240 px wide, click to enlarge in a lightbox).
- Other files render as a download pill with file name and size.

**Order context panel:**
- When a conversation has an `orderId`, add a collapsible panel at the top of the chat area showing:
  - Order number, status badge, item thumbnail, price.
  - Quick action button matching the order status (e.g., `Confirm Receipt` if `IN_PROGRESS`).

**Online status:**
- Replace the hardcoded `Online` text with logic that reads `lastSeenAt` from the conversation partner data:
  - < 5 min → green dot `Online`
  - < 60 min → yellow dot `Active recently`
  - Otherwise → gray dot `{timeAgo(lastSeenAt)}`

**Share listing:**
- In the attachment menu, `Share Listing` opens a search/browse modal to pick one of the sender's active listings.
- Selected listing renders as a card message with title, game, price, and a `View` link.

### Acceptance Criteria — Wallet

- [ ] Buyer can deposit funds via Flutterwave or Paymento from the wallet page.
- [ ] Wallet balance updates after successful top-up webhook.
- [ ] Top-up transactions appear in transaction history labelled `Deposit`.
- [ ] Buyer can pay for an order using wallet balance if sufficient funds exist.
- [ ] Failed/cancelled top-ups do not credit the wallet.

### Acceptance Criteria — Messaging

- [ ] Typing indicators appear and disappear correctly for both participants.
- [ ] Images upload and render inline in the chat.
- [ ] Online/last-seen status reflects real `lastSeenAt` data.
- [ ] Conversations with an order show the order context panel.
- [ ] Seller can share a listing card from within a conversation.

---

## 3. Order Management

### Current State

`frontend/src/app/orders/page.tsx` renders a list of orders with status badges and countdown timers. The individual order detail page (`/orders/[id]`) has a timeline via `getOrderTimeline`. The backend (`orders.service.ts`) handles `createOrder`, `acceptOrder`, `markDelivered`, `confirmDelivery`, and dispute creation. Good foundations, but missing:

- **Buyer side:** No status-based filter (only active/all tabs). No game filter. No date range filter. No export/download receipt.
- **Seller side:** No consolidated seller order dashboard. Seller must go to `/orders/[id]` individually.
- **Analytics:** No summary of spend (buyer) or earnings (seller) by period or game.
- **Order detail page:** No per-order message thread shortcut. No inline delivery form (seller submits credentials directly in the order). No receipt PDF generation.
- **Dispute:** Users open disputes from the order page but there is no in-app dispute tracker showing status updates from the admin.

### Backend Requirements

**Order list filtering:**

Extend `GET /orders/me` to accept query params:
- `status` — filter by `OrderStatus` enum value
- `gameName` — filter by associated listing game name (via `orderItems → listing.gameName`)
- `from` / `to` — date range on `createdAt`
- `page` / `limit` — pagination (default limit 20)

**Seller order dashboard:**

New endpoint `GET /orders/seller` (requires `SELLER` role) that returns orders where `order.sellerId` matches the authenticated seller, with same filter params as above. Currently `GET /orders/me` returns buyer orders only — this needs to be role-aware or a separate endpoint.

**Order receipt:**

New endpoint `GET /orders/:id/receipt` — returns a JSON receipt object (order number, items, amounts, buyer/seller details, escrow status, completed timestamp). The frontend will render this as a printable HTML page.

**Delivery submission:**

Extend `PATCH /orders/:id/deliver` to accept an optional `deliveryData` JSON body:
```ts
{
  credentials?: { username?: string; password?: string; email?: string; loginMethod?: string };
  notes?: string;
  screenshotUrls?: string[];
}
```
This replaces the free-text note approach and enables structured credential delivery that is visible only to the buyer.

**Dispute status tracker:**

Extend `GET /orders/:id` response to include the full `disputes` array with `status`, `createdAt`, `resolvedAt`, `resolution`, and `adminNotes` (admin notes shown only when status is `RESOLVED_*`). Currently only `disputes: disputes[]` is included but the dispute detail is not surfaced to the user.

### Frontend Requirements

**Orders list page (`/orders`) improvements:**

- Replace the two tabs (`active` / `all`) with a **status filter** row: `All | Pending | Paid | In Progress | Completed | Cancelled | Disputed`. Active counts shown as badges.
- Add **game filter** dropdown (populated from the user's own order history, not a hardcoded list).
- Add **date range** filter (from / to).
- Add **seller/buyer view toggle** for users who are both buyers and sellers — switches between `GET /orders/me` and `GET /orders/seller`.
- Pagination: load 20 per page with `Load More` button.

**Order detail page (`/orders/[id]`) improvements:**

- **Delivery form (seller view):** When order status is `PAID` and the seller has accepted, show a form in the order detail:
  - Username / Password / Email / Login Method fields (pre-populated from listing)
  - Notes field
  - Screenshot upload (up to 3)
  - `Mark as Delivered` button submits the form
- **Credentials view (buyer view):** When order status is `IN_PROGRESS` or `DELIVERED`, show a locked card with the delivery credentials. Only visible to the buyer who placed the order.
- **Receipt button:** When order is `COMPLETED`, show a `Download Receipt` button that opens a printable page at `/orders/:id/receipt`.
- **Dispute tracker:** When a dispute exists, render a timeline within the order showing `Opened → Under Review → Resolved`. Show admin notes when available.
- **Message shortcut:** A `Message Seller/Buyer` button that navigates to `/messages?conversationId=...` if a conversation exists, or creates one if not.

**Seller dashboard (`/seller/dashboard`):**

- Add an `Orders` tab showing `GET /orders/seller` results with the same filters.
- Summary stats card: total orders this month, revenue this month, pending deliveries count.

### Acceptance Criteria

- [ ] Buyer can filter their orders by status, game, and date range.
- [ ] Seller can view all their orders in one place via the seller dashboard or `/orders/seller`.
- [ ] Seller can submit structured delivery credentials through the order detail page.
- [ ] Buyer sees delivery credentials only after order is in `IN_PROGRESS` state.
- [ ] Completed orders show a downloadable/printable receipt.
- [ ] Dispute status and admin notes are visible to both parties from the order detail page.
- [ ] Pagination works — load 20 at a time, `Load More` fetches next page.

---

## 4. Improved Trust-Trade Escrow System

### Current State

The escrow system (`escrow.service.ts`) has a solid lifecycle: `HELD → RELEASED | REFUNDED | DISPUTED`. The `/escrow` page is an informational page about how escrow works. The order tracking content handles the active escrow flow. Key gaps:

- The escrow system is not branded anywhere as "Trust-Trade" in the UI — users just see "escrow".
- The dispute flow is minimal — users can open a dispute but there is no guided evidence submission.
- There is no partial release / milestone escrow for multi-step services (e.g., coaching that happens in sessions).
- Auto-release logic exists via deadline timers but is not visually surfaced (users don't know escrow will auto-release).
- Seller cannot request early release with buyer agreement.
- No escrow hold extension when a dispute is opened (currently the release timer continues).

### Backend Requirements

**Branding — no backend change required.** The escrow system already exists; branding is a frontend concern.

**Dispute evidence submission:**

Extend `POST /disputes` to accept:
```ts
{
  orderId: string;
  reason: string;
  description: string;
  evidenceUrls: string[];   // uploaded screenshot URLs
  evidenceText?: string;    // additional text evidence
}
```
Add `evidenceUrls` and `evidenceText` fields to the `disputes` model:
```prisma
// Add to disputes model
evidenceUrls  String[]  @default([])
evidenceText  String?
```
Also allow adding evidence after opening: `PATCH /disputes/:id/evidence` accepts `{ evidenceUrls, evidenceText }` and appends to existing evidence.

**Mutual early release:**

New endpoint `POST /orders/:orderId/request-release` (seller only) — creates a release request in `order.metadata.releaseRequest = { requestedAt, requestedBy: sellerId }`.

New endpoint `POST /orders/:orderId/confirm-release` (buyer only) — checks `metadata.releaseRequest` exists, then calls `escrow.releaseFunds(orderId)` directly (same as normal `confirmDelivery` path).

**Dispute hold timer:**

When a dispute is created (`DisputeStatus.OPEN`), set `order.buyerConfirmDeadline = null` in the same transaction to prevent the escrow auto-release timer from expiring while the dispute is active.

**Milestone escrow (for services/gigs):**

This is a future capability; for now, add the data model groundwork:
```prisma
model escrowMilestones {
  id          String   @id @default(cuid())
  escrowId    String
  label       String   // e.g. "Session 1 Complete"
  amount      Decimal  @db.Decimal(12, 2)
  status      String   @default("HELD") // HELD | RELEASED | REFUNDED
  releasedAt  DateTime?
  createdAt   DateTime @default(now())

  escrow      escrowTransactions @relation(fields: [escrowId], references: [id])

  @@map("escrow_milestones")
}
```
No service logic required yet — just schema and migration. The UI can expose this as a "coming soon" feature.

### Frontend Requirements

**Trust-Trade branding:**

- Rename all user-facing references from "escrow" / "piyrox escrow" to **"Trust-Trade"** where the user directly interacts with it:
  - Order detail page: "Funds secured in Trust-Trade"
  - Wallet: locked balance label → "In Trust-Trade"
  - Status badge on orders: "Trust-Trade Active" instead of "Funds in Escrow"
  - The `/escrow` info page title → "How Trust-Trade Works"
- The developer-facing code, DB column names, and API paths do not change — only UI strings.

**Dispute evidence flow:**

Redesign the dispute opening modal/page (`/orders/[id]` → `File a Dispute`):

```
Step 1: Choose reason
  → Item not received | Wrong credentials | Service not delivered | Other

Step 2: Describe the issue
  → Text area (min 50 chars)

Step 3: Upload evidence
  → Up to 5 screenshots (image/*)
  → CameraCapture.tsx can be used on mobile

Step 4: Review & Submit
  → Summary of dispute details
  → "Submit Dispute" → POST /disputes

Step 5: Confirmation
  → "Dispute opened. Our team reviews within 24–72 hours."
  → Link to order with dispute tracker visible
```

**Mutual release UI (Order detail — seller view):**

When order is `IN_PROGRESS` and seller has delivered, add a `Request Early Release` button that calls `POST /orders/:id/request-release`. Shows a pending state: `"Waiting for buyer to confirm release."` The buyer sees a banner: `"Seller has requested early release. [Confirm Release] [Decline]"`.

**Auto-release visibility:**

Show a countdown in the order detail page under the Trust-Trade status card: `"Trust-Trade auto-releases in: HH:MM:SS"` whenever `buyerConfirmDeadline` is set and the order is in `IN_PROGRESS`. This disappears when a dispute is active.

### Acceptance Criteria

- [ ] All user-facing "escrow" labels read "Trust-Trade" across orders, wallet, and the info page.
- [ ] Dispute opening wizard collects reason, description, and up to 5 evidence screenshots.
- [ ] Seller can request early release; buyer can confirm or decline.
- [ ] When a dispute is opened, the auto-release countdown stops (deadline is cleared).
- [ ] Auto-release countdown is visible to the buyer on the order detail page.
- [ ] `escrow_milestones` table exists in the DB after migration.

---

## 5. Auto Pricing Suggestion (AI)

### Current State

`listings.service.ts` has `estimateAccountValue()` — a rule-based engine using hardcoded base prices per game, rank multipliers, and platform multipliers. It returns a point estimate but:

- It is called as a one-off endpoint; the sell form does not display a live pricing suggestion as the user fills in the form.
- The suggestion is not context-aware of current market prices (existing active listings).
- There is no price range (min–max) — only a single estimate.
- The `skins` parameter in the function signature is typed as `number` but the listings model stores `skins` as `Json?` (array of objects). The function ignores actual skin value.
- No explanation is shown to the user — they just get a number with no reasoning.

### Backend Requirements

**Improve `estimateAccountValue`:**

Update the function to:

1. **Factor in listing count and actual market prices** — query existing `ACTIVE` listings for the same `gameId` and `rank` bracket, compute `p25`, `median`, and `p75` of current prices. Use these to calibrate the estimate and return a range.

2. **Factor in skins count** — the `skins` parameter should accept `number` (count) or a JSON array. If an array, use `array.length`; add a `skinValueBonus` of `$2` per skin (capped at `$50`).

3. **Add item count and extras bonuses:**
   - `hasElitePass` / `hasBattlePass`: `+$10–$15` depending on game
   - `level`: already exists but capped at `level * 0.5` (USD)

4. **Return structure:**
```ts
{
  suggestedMin: number;
  suggested: number;      // central estimate
  suggestedMax: number;
  confidence: 'low' | 'medium' | 'high';  // based on sample size
  marketSampleSize: number;   // how many active listings were used
  reasoning: string[];        // human-readable breakdown lines
}
```

5. **Confidence levels:**
   - `high`: ≥ 10 comparable listings found
   - `medium`: 3–9 comparable listings
   - `low`: < 3 comparable listings (relies purely on heuristics)

**Endpoint:** `POST /listings/estimate-value` — already exists. Extend request body to accept `skins` as a number, `hasElitePass?: boolean`, `hasBattlePass?: boolean`. No auth required (so buyers can also see estimates).

**Market price endpoint:**

New `GET /listings/market-stats?gameId=&rank=&platform=` — returns `{ p25, median, p75, count }` for active listings matching the criteria. Used by the frontend price chart widget.

### Frontend Requirements

**Sell form (`/sell` or `/new-listings`) — live price suggestion widget:**

Position a `💡 Suggested Price` card to the right of or below the price input field. It:

- Fires automatically when `gameId`, `rank`, and `platform` are all filled in (debounced 800 ms).
- Shows a loading skeleton while fetching.
- Renders:
  ```
  💡 Suggested Price Range
  ━━━━━━━━━━━━━━━━━━━━━━━
  Min: $18      Suggested: $25      Max: $38
  ━━━━━━━━━━━━━━━━━━━━━━━
  Based on 12 active listings for Gold-rank Free Fire accounts.
  
  Breakdown:
  • Base value: $25
  • Gold rank multiplier: ×1.0
  • 8 skins: +$16
  • Elite Pass: +$10
  ```
- A `Use Suggested` button pre-fills the price input with the central `suggested` value.
- Confidence badge: `High Confidence` (green) / `Medium` (yellow) / `Low — limited data` (gray).
- If `marketSampleSize === 0`, show: `"No comparable listings found — estimate based on platform averages only."`

**Listing detail page (`/listings/[id]`):**

- For buyers, show a small `Fair Price` indicator: a colored pill that says `Below Market`, `Fair Price`, or `Above Market` based on comparing the listing price to the `median` from `GET /listings/market-stats`.
  - `< p25` → `🔥 Hot Deal` (green)
  - `p25 – p75` → `✓ Fair Price` (neutral)
  - `> p75` → `Above Market` (amber)

### Acceptance Criteria

- [ ] `estimateAccountValue` returns `{ suggestedMin, suggested, suggestedMax, confidence, marketSampleSize, reasoning }`.
- [ ] Estimate factors in current market data (active comparable listings) when available.
- [ ] Sell form shows a live pricing suggestion widget that updates as the user fills in game details.
- [ ] `Use Suggested` button fills the price field.
- [ ] Listing detail page shows a `Fair Price` / `Hot Deal` / `Above Market` indicator.
- [ ] `GET /listings/market-stats` endpoint returns percentile stats for a game/rank/platform combo.

---

## 6. Game-Specific Listing Templates

### Current State

`frontend/src/components/GameListingTemplate.tsx` renders a listing detail view with game-specific fields. `frontend/src/lib/games.ts` has a comprehensive `GAME_CONFIG` registry covering Free Fire, COD Mobile, Blood Strike, eFootball, PUBG Mobile, and others. The `listings` model has fields for `rank`, `level`, `skins`, `loginMethod`, `region`, `platform`, `playerId`, `playerUid`, `linkedAccounts`.

However:
- The **sell form** does not use `GAME_CONFIG` to drive what fields are shown/required. It uses a generic form with all fields visible for all games.
- Required-field validation is not game-specific (e.g., Free Fire must have `playerId` / UID; eFootball doesn't have ranks).
- Rank dropdowns are not populated from `GAME_CONFIG[game].ranks` — they use a static hardcoded list.
- The `skins` field is a generic JSON field — there is no guided skin entry (name, rarity, image URL) that matches how each game organizes cosmetics.
- Login method dropdown is not game-specific — all games show all login methods.

### Backend Requirements

**No new endpoints required.** The backend already accepts all required fields. One minor improvement:

**Validation improvement in `CreateListingDto`:**

- Add a `gameSlug` field that maps to `GAME_CONFIG` keys.
- Add conditional validation: if `gameSlug` is `'free-fire'` or `'pubg-mobile'`, require `playerId`. If `gameSlug` has `hasRanked: true`, require `rank`.

Since this validation depends on runtime game config that exists in `games.ts` (a frontend file), mirror the minimal validation requirements in a `GAME_RULES` constant inside `backend/src/modules/listings/game-rules.ts`:

```ts
export const GAME_RULES: Record<string, { requiresPlayerId: boolean; requiresRank: boolean }> = {
  'free-fire':     { requiresPlayerId: true,  requiresRank: true },
  'pubg-mobile':   { requiresPlayerId: true,  requiresRank: true },
  'cod-mobile':    { requiresPlayerId: false, requiresRank: true },
  'blood-strike':  { requiresPlayerId: false, requiresRank: false },
  'efootball':     { requiresPlayerId: false, requiresRank: false },
  'mobile-legends':{ requiresPlayerId: true,  requiresRank: true },
  'valorant':      { requiresPlayerId: false, requiresRank: true },
  'roblox':        { requiresPlayerId: true,  requiresRank: false },
}
```

Use this in `CreateListingDto` validation via a custom `@ValidateIf` decorator.

### Frontend Requirements

**Sell form redesign — game-driven field visibility:**

After the user selects a game (step 1 of the sell flow), the form dynamically shows only the fields relevant to that game based on `GAME_CONFIG[gameName].accountFields`:

```
All games:
  - Title (required)
  - Description (required)
  - Price (required, with AI suggestion widget)
  - Region (from REGIONS constant)
  - Platform (from GAME_CONFIG[game].platforms — only platforms that game runs on)
  - Images (up to 5)

If accountFields.rank === true:
  - Rank (dropdown from GAME_CONFIG[game].ranks, ordered low → high)
  - Previous rank season high (optional)

If accountFields.level === true:
  - Account Level (number input)

If accountFields.loginMethod === true:
  - Login Method (dropdown from GAME_CONFIG[game].loginMethods only)

If GAME_RULES[game].requiresPlayerId === true:
  - Player ID / UID (required, with format hint per game)

If accountFields.battlePass exists:
  - Has {battlePass name}? (checkbox, e.g. "Has Elite Pass?")
  - Current season? (yes/no)

accountFields.extras:
  - For each extra (e.g. "Skins", "Pets", "Characters"):
    → A multi-input list: user can add entries with Name + Rarity (dropdown: Common / Rare / Epic / Legendary / Exclusive)
    → Each entry optionally has an imageUrl (upload or paste URL)
    → Renders as a chip list while building, stored as JSON array in `skins` / `inventory` field
```

**Game-specific placeholder text and tooltips:**
- Player ID field for Free Fire: `"Free Fire UID (found in your profile)"` with a tooltip showing where to find it.
- For COD Mobile: `"Activision ID"`.
- Rank dropdown for Free Fire: ordered `Bronze → Silver → Gold → Platinum → Diamond → Heroic → Grandmaster`.

**Template preview:**

Add a live `Preview` tab alongside the `Edit` tab in the sell form. The preview renders `GameListingTemplate.tsx` with the current form data, so the seller sees exactly what buyers will see before submitting.

**Game category on listing card (`ListingCard.tsx`):**

- Show the game-specific currency icon/abbreviation (e.g., "💎 Diamonds" for Free Fire) when relevant.
- Show rank badge styled with the game's color (`GAME_CONFIG[game].color`).

### Acceptance Criteria

- [ ] Sell form shows only the fields relevant to the selected game.
- [ ] Rank dropdown is populated from `GAME_CONFIG[gameName].ranks` in the correct order.
- [ ] Login method dropdown shows only methods valid for the selected game.
- [ ] Player ID field is required for games that need it (`GAME_RULES`), validated backend and frontend.
- [ ] Skins/extras can be added as structured entries (name + rarity).
- [ ] Live preview tab shows a real-time render of the listing as it will appear to buyers.
- [ ] `GAME_RULES` validation in backend returns a clear error for missing required game fields.

---

## 7. Push Notifications

### Current State

`NotificationProvider.tsx` has:
- Socket.io real-time in-app notifications
- 30-second polling fallback
- In-app toast stack (bottom-right)
- Native browser `Notification` API (requested on first notification, works only while the browser tab is open)

Missing:
- Web Push (service worker + Push API) — notifications delivered even when the app is not open
- FCM (Firebase Cloud Messaging) for cross-browser support and mobile PWA
- Per-notification-type preferences (user can control which types they receive)
- Push subscription management (multiple devices)

### Backend Requirements

**New model — push subscriptions:**

```prisma
model pushSubscriptions {
  id          String   @id @default(cuid())
  userId      String
  endpoint    String   @unique
  p256dh      String
  auth        String
  userAgent   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        users    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("push_subscriptions")
}
```

Add the relation to the `users` model:
```prisma
pushSubscriptions pushSubscriptions[]
```

**New endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/notifications/push/subscribe` | Body: `{ endpoint, keys: { p256dh, auth }, userAgent? }`. Upserts a push subscription for the authenticated user. Returns `{ success: true }`. |
| `DELETE` | `/notifications/push/unsubscribe` | Body: `{ endpoint }`. Removes the subscription. |
| `GET` | `/notifications/push/vapid-key` | Returns the VAPID public key for client-side subscription setup. |
| `PATCH` | `/notifications/preferences` | Body: `{ [NotificationType]: boolean }`. Updates `user.notificationPreferences`. |
| `GET` | `/notifications/preferences` | Returns current notification preferences. |

**Push delivery service (`PushService`):**

New injectable `PushService` using the `web-push` npm package:
- `sendPushToUser(userId, { title, body, icon, data })` — fetches all active subscriptions for the user, sends to each. Handles `410 Gone` (expired subscription — delete it from DB).
- VAPID keys stored in env: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (mailto or URL).
- Integrate with `NotificationsService.createNotification()` — after creating the DB notification record, call `pushService.sendPushToUser()` for notification types the user has enabled.

**Notification preferences defaults:**

```ts
const DEFAULT_PREFERENCES: Record<NotificationType, boolean> = {
  ORDER_STATUS: true,
  MESSAGE: true,
  DISPUTE: true,
  WITHDRAWAL: true,
  LISTING_APPROVED: true,
  LISTING_REJECTED: true,
  KYC_APPROVED: true,
  KYC_REJECTED: true,
  FRAUD_ALERT: true,
  SYSTEM: false,
}
```

If `user.notificationPreferences` is null, use defaults.

### Frontend Requirements

**Service worker (`frontend/public/sw.js`):**

```js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Piyrox', {
      body: data.body,
      icon: '/logo.png',
      badge: '/badge-72.png',
      data: data.data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
```

Register the service worker in `NotificationProvider.tsx`:
```ts
if ('serviceWorker' in navigator && 'PushManager' in window) {
  const reg = await navigator.serviceWorker.register('/sw.js');
  // fetch VAPID key, subscribe, POST to /notifications/push/subscribe
}
```

**Push subscription flow:**

- After login, `NotificationProvider` checks if a push subscription exists for this device.
- If not, after the first user interaction (not on mount) show a non-intrusive permission request banner: `"Get notified about your orders even when the app is closed. [Enable] [Not now]"`.
- `Enable` → call `Notification.requestPermission()` → subscribe to Push → `POST /notifications/push/subscribe`.
- `Not now` → set `localStorage.piyrox_push_dismissed = true` (don't ask again this session).

**Notification preferences page (`/notifications/preferences`):**

New page (or section within profile settings) with toggle switches for each notification type:

```
Order Updates        [●──] ON
New Messages         [●──] ON
Dispute Updates      [●──] ON
Withdrawals          [●──] ON
Listing Approved     [●──] ON
KYC Updates          [●──] ON
System Announcements [──●] OFF
```

Each toggle calls `PATCH /notifications/preferences` immediately (debounced 500 ms).

**Existing notification bell (`NotificationBell.tsx`):**

- Add a `⚙` settings icon button that navigates to `/notifications/preferences`.

### Acceptance Criteria

- [ ] Service worker is registered and handles `push` events.
- [ ] User can subscribe to push notifications — subscription is saved to DB.
- [ ] Push notifications are delivered when the app is closed (tested in a second browser tab and closed).
- [ ] Each `NotificationType` can be toggled per-user from the preferences page.
- [ ] Unsubscribing from push notifications removes the subscription from DB.
- [ ] Expired push subscriptions (410 responses) are cleaned up automatically.
- [ ] Permission request banner is shown once per session, not on every page load.

---

## 8. Improved Trust Badge System

### Current State

Two badge components exist:
- `VerifiedBadge.tsx` — driven by `seller.isVerified` (set to `true` after KYC approval). Variants: `pill` | `solid` | `badge`.
- `SellerLevelBadge.tsx` — shows `BRONZE` / `SILVER` / `GOLD` / `ELITE` with gradient styling.

The verification badge only signals KYC status. There is no way to distinguish:
- KYC-verified sellers vs. subscription-tier verified sellers (Seller Pro badge)
- Fast responders vs. slow ones
- Top-performing sellers vs. new ones
- Sellers with high delivery success rate
- Platform-endorsed / featured sellers

Buyers have no badges at all.

### Backend Requirements

**Seller badge computation:**

Add a computed `badges` array to the seller profile response in `getSellerProfile()`. This is computed at read time — no new DB columns needed (all data already exists on the `sellers` record):

```ts
type BadgeType =
  | 'KYC_VERIFIED'         // kycStatus === 'APPROVED'
  | 'SELLER_PRO'           // subscriptionTier === 'PRO'
  | 'SELLER_PREMIUM'       // subscriptionTier === 'PREMIUM'
  | 'TOP_SELLER'           // totalSales >= 50 && averageRating >= 4.5
  | 'FAST_RESPONDER'       // avgResponseTimeHours < 1
  | 'RELIABLE_DELIVERY'    // deliverySuccessRate >= 98 && totalSales >= 10
  | 'NEW_SELLER'           // createdAt within last 30 days

interface SellerBadge {
  type: BadgeType;
  label: string;
  description: string;
  icon: string;  // emoji or icon name
  color: string; // CSS color class
}
```

Add badge computation to `SellersService.getSellerProfile()` and `getPublicStore()`:

```ts
function computeBadges(seller: sellers): SellerBadge[] {
  const badges: SellerBadge[] = [];
  if (seller.kycStatus === 'APPROVED')
    badges.push({ type: 'KYC_VERIFIED', label: 'ID Verified', ... });
  if (seller.subscriptionTier === 'PREMIUM')
    badges.push({ type: 'SELLER_PREMIUM', label: 'Seller Premium', ... });
  else if (seller.subscriptionTier === 'PRO')
    badges.push({ type: 'SELLER_PRO', label: 'Seller Pro', ... });
  if (seller.totalSales >= 50 && seller.averageRating >= 4.5)
    badges.push({ type: 'TOP_SELLER', label: 'Top Seller', ... });
  if (seller.avgResponseTimeHours < 1 && seller.totalSales >= 5)
    badges.push({ type: 'FAST_RESPONDER', label: 'Fast Responder', ... });
  if (seller.deliverySuccessRate >= 98 && seller.totalSales >= 10)
    badges.push({ type: 'RELIABLE_DELIVERY', label: 'Reliable Delivery', ... });
  if (Date.now() - seller.createdAt.getTime() < 30 * 86400000 && seller.totalSales === 0)
    badges.push({ type: 'NEW_SELLER', label: 'New Seller', ... });
  return badges;
}
```

Also expose `badges` on the listings search result (seller sub-object in `GET /listings`) and on `GET /orders/:id` seller data — so badges appear wherever seller info appears.

### Frontend Requirements

**`TrustBadge.tsx` — new unified component** replacing the two separate badge components:

```tsx
// Props
interface TrustBadgeProps {
  type: BadgeType;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  showTooltip?: boolean;
}
```

Badge designs:

| Badge | Icon | Color | Label |
|-------|------|-------|-------|
| `KYC_VERIFIED` | ✅ | Emerald | ID Verified |
| `SELLER_PRO` | ⚡ | Violet | Seller Pro |
| `SELLER_PREMIUM` | 👑 | Amber | Seller Premium |
| `TOP_SELLER` | 🏆 | Gold gradient | Top Seller |
| `FAST_RESPONDER` | ⚡ | Sky | Fast Responder |
| `RELIABLE_DELIVERY` | 📦 | Green | Reliable Delivery |
| `NEW_SELLER` | 🌱 | Teal | New Seller |

Each badge renders as a small pill with icon + optional label. On hover (or click on mobile), shows a tooltip with the `description` explaining how it is earned.

**`SellerBadgeRow.tsx` — new component:**

```tsx
// Renders a horizontal row of up to N badges for a seller
<SellerBadgeRow badges={seller.badges} max={3} />
// Shows first `max` badges with a "+N more" overflow pill if the seller has more
```

Use `SellerBadgeRow` in:
- `ListingCard.tsx` — show below seller name (max 2 badges)
- Seller public store page header (max 5 badges)
- Order detail page seller section (max 3 badges)
- Search result cards (max 2 badges)

**`VerifiedBadge.tsx` update:**

Simplify `VerifiedBadge` to just render a `TrustBadge` of type `KYC_VERIFIED`. Keep the component name for backwards compatibility.

**`SellerLevelBadge.tsx`:**

Keep unchanged — seller level (Bronze/Silver/Gold/Elite) is a separate concept from trust badges.

**Badge info page:**

Add a section to `/escrow` info page (or a new `/trust` page) explaining each badge — what it means and how sellers earn it.

### Acceptance Criteria

- [ ] `getSellerProfile` and listing search results include a `badges` array computed from live seller data.
- [ ] `TrustBadge` component renders correctly for all 7 badge types with tooltip.
- [ ] `SellerBadgeRow` shows up to `max` badges with overflow count.
- [ ] Badges appear on listing cards, seller profile, and order detail.
- [ ] `VerifiedBadge` continues to work (renders as `KYC_VERIFIED` badge internally).
- [ ] Hovering a badge on desktop shows a tooltip explaining how it was earned.

---

## 9. Advanced Search & Filter

### Current State

`frontend/src/app/search/search-content.tsx` has: keyword, game, platform, region, min/max price. The backend `GET /listings` endpoint in `listings.service.ts` supports: `search`, `gameName`, `platform`, `region`, `minPrice`, `maxPrice`, `sortBy`, `page`, `limit`.

Missing from the frontend:
- Rank filter (backend already supports it as `rank`)
- Sort by options (price asc/desc, newest, most popular, top rated) — backend supports `sortBy` but frontend has no control
- `isVerified` seller filter
- Seller level filter
- Saved/bookmarked searches
- Search result count and "no results" state improvements
- URL-synced filters (filters should be in the URL so they're shareable and survive page refresh)
- Mobile filter sheet (the sidebar doesn't collapse gracefully on mobile)
- Listing card shows rank and level info but no seller level badge

Missing from the backend (minor):
- `rank` filter is not in the public endpoint's query validation
- `sellerLevel` filter not supported
- `isVerified` seller filter not supported
- Full-text search uses ILIKE — no ranking of results by relevance

### Backend Requirements

**Extend `GET /listings` query params:**

| Param | Type | Description |
|-------|------|-------------|
| `rank` | `string` | Exact rank match (e.g. `"Heroic"`) |
| `rankMin` | `string` | Minimum rank (requires rank order lookup in `GAME_CONFIG`) |
| `sellerLevel` | `BRONZE\|SILVER\|GOLD\|ELITE` | Filter by seller level |
| `isVerified` | `boolean` | Only show listings from KYC-verified sellers |
| `sortBy` | `price_asc\|price_desc\|newest\|popular\|top_rated` | Sort order |

**Rank range filtering:**

Create a `RANK_ORDER` map in the listings service:
```ts
const RANK_ORDER: Record<string, string[]> = {
  'Free Fire':   ['Bronze','Silver','Gold','Platinum','Diamond','Heroic','Grandmaster'],
  'COD Mobile':  ['Rookie','Bronze','Silver','Gold','Platinum','Diamond','Pro','Master','Grandmaster','Legendary'],
  // ... other games
}
```
When `rankMin` is provided with `gameName`, filter `rank` to only those at or above the minimum index.

**`sellerLevel` and `isVerified` filters:**

Join to the `sellers` table and add `WHERE` clauses:
- `sellerLevel`: `sellers.sellerLevel = $level`
- `isVerified`: `sellers.isVerified = true AND sellers.kycStatus = 'APPROVED'`

**`sortBy` mappings:**

| Value | `orderBy` |
|-------|-----------|
| `price_asc` | `price ASC` |
| `price_desc` | `price DESC` |
| `newest` | `createdAt DESC` (current default) |
| `popular` | `salesCount DESC, viewCount DESC` |
| `top_rated` | `seller.averageRating DESC` |

**Saved searches (new feature):**

New model:
```prisma
model savedSearches {
  id        String   @id @default(cuid())
  userId    String
  name      String
  params    Json     // serialized search params
  createdAt DateTime @default(now())

  user      users    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("saved_searches")
}
```

Endpoints:
- `POST /search/save` (auth required): `{ name, params }` — saves current search.
- `GET /search/saved` (auth required): returns user's saved searches.
- `DELETE /search/saved/:id` (auth required): deletes a saved search.

### Frontend Requirements

**URL-synced filters:**

Replace the component state-only filters with `useSearchParams` / `router.replace()` so every filter is reflected in the URL query string. Navigating back restores the filter state.

```
/search?query=free+fire&gameName=Free+Fire&rank=Heroic&sortBy=price_asc&isVerified=true
```

**New filter controls:**

Add to the sidebar / filter panel:

1. **Sort By** (dropdown at top of results):
   - Newest | Price: Low to High | Price: High to Low | Most Popular | Top Rated

2. **Rank** (conditional — only show when a game with `hasRanked: true` is selected):
   - Minimum rank dropdown, populated from `GAME_CONFIG[game].ranks`

3. **Seller Quality** (checkbox group):
   - `☐ Verified sellers only`
   - `☐ Gold level and above`
   - `☐ Elite sellers only`

4. **Delivery Time** (new filter on listings that have `deliveryTime`):
   - `Any` | `Under 30 min` | `Under 1 hour` | `Under 24 hours`

**Mobile filter sheet:**

On mobile (< `lg` breakpoint), replace the sidebar with a bottom sheet:
- A sticky `Filters` button at the bottom of the screen with active filter count badge.
- Tapping it slides up a sheet with all filter controls.
- `Apply Filters` button at the bottom of the sheet.
- `Clear All` resets all filters.

**Saved searches:**

- Authenticated users see a `Save Search` button in the filter panel header.
- Clicking opens a modal: enter a name → `POST /search/save`.
- Saved searches appear in a `My Saved Searches` dropdown at the top of the search page.
- Clicking a saved search applies all its params to the URL and triggers a fetch.

**Search result improvements:**

- Show `{count} listings found` above results, updating live.
- `No results` state: show suggestions (try removing filters, or browse by game).
- Listing cards in results show:
  - Seller level badge (from `SellerLevelBadge`)
  - `KYC_VERIFIED` badge pill if seller is verified
  - Rank tag if the listing has a rank
  - `🔥 Hot Deal` / `✓ Fair Price` indicator from the AI pricing module (section 5)

### Acceptance Criteria

- [ ] All filters (rank, seller level, verified, sort, delivery time) are functional and reflected in URL.
- [ ] Rank filter only appears when a ranked game is selected; populated from `GAME_CONFIG`.
- [ ] Sort by works correctly for all 5 options.
- [ ] Verified-only filter returns only KYC-approved sellers.
- [ ] Authenticated users can save a search and reload it from the saved searches dropdown.
- [ ] Mobile filter bottom sheet opens and applies filters correctly.
- [ ] Result count updates in real time as filters change.
- [ ] Pagination works with all filter combinations.

---

## 10. Auth Error Handling — Auto Re-login on Invalid Token

### Current State

`frontend/src/lib/api.ts` — the `request()` function throws an error with the server's message when `!response.ok`. There is no special handling for `401 Unauthorized`. The caller (page component) catches the error and typically sets an `error` state variable, rendering a red error banner.

Result: when a user's JWT expires (default 7-day expiry set in `auth.service.ts`), they see a raw error like `"Unauthorized"` or `"Invalid token"` inline in whatever component was fetching data. There is no clear path to re-login — users either manually navigate to `/auth/login` or refresh the page and see the same error.

`frontend/src/app/providers.tsx` — `refreshSession()` reads from `localStorage` but does not validate the token's expiry against the server. There is no token refresh endpoint (no refresh token pattern currently implemented).

### Design Decision

Since the backend issues JWTs without a refresh token mechanism, the correct behavior on a 401 is: clear the session and redirect to login, preserving the user's current URL as a `callbackUrl` so they land back where they were after re-authenticating.

This must be a **global** interception — not per-component — to avoid every page having to handle 401 individually.

### Backend Requirements

**No new endpoints required.** The current backend already returns `401` with `{ message: "Unauthorized" }` for invalid/expired JWTs.

Optional improvement: add a `GET /auth/validate` endpoint that returns `200` if the token is valid and `401` if not, so the frontend can do a silent validation on app load without triggering a full API call.

```ts
// auth.controller.ts
@Get('validate')
@UseGuards(JwtAuthGuard)
validate(@Request() req) {
  return { valid: true, userId: req.user.userId, role: req.user.role };
}
```

### Frontend Requirements

**Global 401 interceptor in `api.ts`:**

In the `request()` function, add a check after receiving a non-OK response:

```ts
if (response.status === 401) {
  // Clear session
  if (typeof window !== 'undefined') {
    localStorage.removeItem('piyrox_token');
    localStorage.removeItem('piyrox_user');
    // Redirect to login with return URL
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/auth/login?callbackUrl=${returnUrl}`;
  }
  // Still throw so the caller's catch block runs (but user is already navigating away)
  throw new Error('Session expired. Please sign in again.');
}
```

**Important guard:** This redirect must not fire for public endpoints (where a 401 is expected for unauthenticated access, like browsing listings). The check should only redirect if a token was present in localStorage:

```ts
if (response.status === 401) {
  const hadToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('piyrox_token'));
  if (hadToken) {
    localStorage.removeItem('piyrox_token');
    localStorage.removeItem('piyrox_user');
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/auth/login?callbackUrl=${returnUrl}`;
    throw new Error('Session expired. Please sign in again.');
  }
  // No token was present — fall through to normal error handling
}
```

**Login page — callbackUrl handling:**

Update `frontend/src/app/auth/login/page.tsx` to read `?callbackUrl` from the URL and redirect there after a successful login instead of always going to `/`:

```ts
const callbackUrl = searchParams.get('callbackUrl') || '/';
// After successful login:
router.push(decodeURIComponent(callbackUrl));
```

Display a contextual message when `callbackUrl` is present: `"Your session expired. Please sign in to continue."` — shown as an info banner above the login form.

**Session validation on app start:**

In `providers.tsx`, after loading the session from localStorage, silently call `GET /auth/validate`:
- If `200`: session is valid, continue.
- If `401`: clear session, but do NOT redirect here (the user might be on a public page like the homepage). The redirect happens naturally when the user tries to perform an authenticated action.

```ts
const validateSession = async () => {
  const token = getToken();
  if (!token) return;
  try {
    await fetch(`${API_BASE}/auth/validate`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    clearSession();
    setUser(null);
  }
};
```

**Improved error messages for 401:**

Audit all places where `setError(err.message)` is used in auth-adjacent components and replace raw `"Unauthorized"` with user-friendly messages:
- `"Your session has expired — you've been signed out."` (for 401 on data fetch)
- `"Incorrect email or password."` (for login failure — already done)
- `"You must be signed in to access this page."` (for 403 on protected resources)

### Acceptance Criteria

- [ ] When a request returns `401` and a token was present in localStorage, the user is redirected to `/auth/login?callbackUrl=<current-path>`.
- [ ] After re-logging in, the user is redirected back to the page they were on.
- [ ] A `"Session expired"` info banner appears on the login page when `callbackUrl` is present.
- [ ] Public pages (browse listings, home, search) do not redirect on 401 — they just fail silently or show a sign-in prompt.
- [ ] On app load, an invalid/expired token is cleared silently without disrupting the page.
- [ ] No page component needs its own 401 redirect logic.

---

## 11. Payment Flow & Login/Sign-Up Page Redesign

### 11A — Payment Flow

#### Current State

The current payment flow:
1. Buyer places an order → order is created with status `PENDING`
2. Buyer is taken to `/orders/[id]` or clicks a button that calls `POST /escrow/order/:id/pay`
3. Backend generates a hosted payment URL (Flutterwave or Paymento)
4. Buyer is redirected to the provider's hosted page
5. After payment, the webhook fires → order status updates to `PAID`
6. Buyer lands back on the order page via the `callbackUrl`

Issues:
- No clear checkout flow — the transition from listing → order → payment is jarring. There is a `/checkout` directory but no `page.tsx` inside it.
- Buyers don't know which payment methods are available before creating the order.
- No order summary / confirmation screen before payment.
- Wallet-based payment is not available (addressed in Section 2A).
- Payment provider selection happens via `order.metadata.paymentMethod` set at order creation, but the UI doesn't prominently show this choice.
- After webhook confirmation, the buyer is on the callback URL but the order status may still show `PENDING` briefly (webhook race condition).
- Mobile Money options (MTN MoMo, Airtel, Vodafone — all in `PaymentProvider` enum) are not surfaced in the UI.
- No explicit error page for failed payments.

#### Backend Requirements

**Checkout initiation endpoint:**

New endpoint `POST /checkout/initiate` (replaces the scattered order-then-payment flow):
```ts
{
  listingId: string;
  quantity: number;
  paymentMethod: 'WALLET' | 'FLUTTERWAVE' | 'PAYMENT_IO' | 'MOMO_MTN' | 'MOMO_AIRTEL';
  buyerNote?: string;
  currency?: string;
}
```

Response:
```ts
{
  orderId: string;
  orderNumber: string;
  paymentMethod: string;
  paymentUrl: string | null;  // null if wallet payment
  requiresRedirect: boolean;
  totalAmount: number;
  currency: string;
}
```

Internally: calls `createOrder()` then `generatePaymentLink()` in a single request, so the buyer gets both the order ID and the payment URL in one round-trip.

**Payment status polling endpoint:**

`GET /orders/:id/payment-status` — returns `{ status: OrderStatus, paymentStatus: PaymentStatus | null }`. Used by the success/callback page to poll until `status === 'PAID'` (handles webhook delay).

**Mobile Money support:**

Add `MoMo` provider handling in `FlutterwaveService` — Flutterwave supports Mobile Money natively via the same API with `payment_options: 'mobilemoney'`. Update `createCharge` to accept an optional `paymentOptions` param and pass it through.

#### Frontend Requirements

**New checkout page (`/checkout/page.tsx`):**

Accessible at `/checkout?listingId={id}` or navigated to from the listing detail `Buy Now` button.

```
Layout:
┌─────────────────────────────────┬──────────────────────┐
│ Order Summary                   │ Payment Method       │
│ ─────────────────────────────── │ ──────────────────── │
│ [item thumbnail]                │ ○ Wallet ($24.50)     │
│ Free Fire Heroic Account        │   (shows balance)     │
│ Gold Rank · Android             │                      │
│ Seller: GameStore  ✅           │ ○ Card / Bank         │
│                                 │   (Flutterwave)       │
│ Subtotal:          $25.00       │                      │
│ Platform fee (10%): -$2.50      │ ○ Crypto (USDT)       │
│ Seller receives:   $22.50       │   (Paymento)          │
│                                 │                      │
│ Total:             $25.00       │ ○ Mobile Money        │
│                                 │   (MTN/Airtel/Vodaf.) │
│ Buyer note: [optional text]     │                      │
│                                 │ [Pay $25.00 →]        │
└─────────────────────────────────┴──────────────────────┘
```

- Wallet option shows current balance. If insufficient, show `"Insufficient balance — Add Funds"` link.
- Mobile Money option shows sub-options: MTN MoMo | Airtel Money | Vodafone Cash.
- `Pay` button calls `POST /checkout/initiate` and either:
  - Redirects to `paymentUrl` (card/crypto/MoMo)
  - Immediately shows success state (wallet payment)

**Payment success/callback page:**

After returning from the provider, the order page polls `GET /orders/:id/payment-status` every 2 seconds for up to 30 seconds:
- While polling: show `"Confirming your payment..."` spinner with Trust-Trade lock icon.
- On `PAID`: show success animation + `"Payment secured in Trust-Trade"` + `View Order` button.
- If polling times out without `PAID`: show `"Payment confirmation pending — we'll notify you when confirmed."` with a support link.

**Payment failed page:**

If the provider redirects back with a failure indicator (e.g., `?status=failed` in callback URL), show:
- `"Payment failed"` with reason (if available from provider).
- `"Try again"` button that re-opens the checkout page.
- `"Contact support"` link.

**Payment method persistence:**

Remember the last-used payment method in `localStorage` (`piyrox_last_payment_method`) and pre-select it on the checkout page.

---

### 11B — Login and Sign-Up Page Redesign

#### Current State

Both pages are functional but minimal:
- Login: email + password + Google OAuth. No phone number option, no "remember me", no 2FA hint.
- Register: 3-step flow (type → details → onboarding) — the flow is good but the visual design is plain and the value proposition is not communicated to new users.
- Both pages use the same minimal `<div>` card layout with no marketing element alongside.

#### Design Requirements

**Login page redesign (`/auth/login`):**

Layout: Two-column on desktop (≥ `lg`):
- **Left column (40%):** Marketing panel — animated game category icons or a screenshot carousel, tagline, 3 trust signals (escrow protection, instant delivery, verified sellers), social proof stat (`12,000+ gamers trust Piyrox`).
- **Right column (60%):** Login form (unchanged functionality).

Form additions:
- `Remember me` checkbox — stores the session token with no expiry hint (already handled by localStorage, but the checkbox gives user awareness).
- Under the `Sign In` button, show: `"By signing in you agree to our Terms and Privacy Policy"` as a small text link.
- `callbackUrl` support (from section 10): when present, show amber info banner: `"Sign in to continue where you left off"`.

**Sign-up page redesign (`/auth/register`):**

Step 1 (account type): Add a brief value proposition below each card:
- Buyer: "Browse 5,000+ verified listings. Every trade protected by Trust-Trade."
- Seller: "Sell your accounts in minutes. Get paid instantly after delivery."

Step 2 (details): Add a phone number field (optional for now, required for KYC later):
```tsx
<input type="tel" placeholder="+234 800 000 0000" 
  className="..." value={phone} onChange={e => setPhone(e.target.value)} />
```
Pass `phone` to `POST /auth/register` body. Backend: add `phone?: string` to `RegisterDto` and save to `users.phone`.

Step 3 (onboarding): Improve with a "Done" animation — confetti burst using CSS `@keyframes` (no external lib needed) when the account is created.

**Shared improvements:**

- Add a `terms` checkbox to the registration form (step 2): `"I agree to the Terms of Service and Privacy Policy"`. Required to proceed.
- Both pages must use the `callbackUrl` query param correctly (section 10).
- Add `aria-label` attributes to all form inputs for accessibility (WCAG 2.1 AA).
- Ensure both pages have proper `<title>` and `<meta description>` via Next.js `metadata` export.

**Backend — `RegisterDto` additions:**

```ts
phone?:       string  // optional phone number
termsAccepted: boolean // must be true (validate with @IsTrue)
```

### Acceptance Criteria — Payment Flow

- [ ] New checkout page shows order summary + payment method selection in a single screen.
- [ ] Wallet payment works when balance is sufficient, debits immediately.
- [ ] Flutterwave and Paymento redirect flows work end-to-end.
- [ ] Mobile Money sub-options (MTN/Airtel/Vodafone) are available and route through Flutterwave.
- [ ] Success state polls until `PAID` status confirmed, shows Trust-Trade confirmation.
- [ ] Failed payments show a clear error page with retry and support options.

### Acceptance Criteria — Login/Sign-Up

- [ ] Login page has a two-column layout on desktop with marketing panel.
- [ ] `callbackUrl` is read from URL and used as the post-login destination.
- [ ] Session-expired banner appears on the login page when `callbackUrl` is present.
- [ ] Register form includes phone (optional) and terms acceptance (required).
- [ ] Terms checkbox is required — form cannot be submitted without it.
- [ ] Registration success shows a confetti/animation on account creation.
- [ ] All form inputs have `aria-label` or associated `<label>` for accessibility.

---

---

## Implementation Priority & Sequencing

The features should be implemented in the following order to minimize rework and maximise user impact:

### Phase 1 — Foundation (do first, everything else depends on these)

| # | Feature | Why first |
|---|---------|-----------|
| 10 | Auth error handling (auto re-login) | Every other feature makes authenticated API calls. A broken session should redirect cleanly, not show cryptic errors. |
| 1 | Full-stack KYC (backend + frontend wizard) | Trust badge system (8), listing gate, and escrow trust all depend on KYC status being reliable. |
| 11B | Login/Sign-Up redesign | Adds `phone` field and `termsAccepted` to registration. Later KYC flow uses phone. |

### Phase 2 — Core Transaction Flows

| # | Feature | Why second |
|---|---------|-----------|
| 11A | Payment flow / checkout page | Centralises the order creation + payment initiation flow. Wallet top-up (2A) feeds into this. |
| 2A | Wallet top-up | Buyers need a deposit path before wallet-payment at checkout is useful. |
| 3 | Order management | Better filters, delivery form, and dispute tracker. Depends on escrow being solid. |
| 4 | Trust-Trade escrow improvements | Dispute evidence flow, mutual release, branding. Phase 1 KYC makes the trust signals meaningful. |

### Phase 3 — Discovery & Listing Quality

| # | Feature | Why third |
|---|---------|-----------|
| 6 | Game-specific listing templates | Better listings feed into better search results. AI pricing depends on accurate listing data. |
| 5 | AI pricing suggestion | Uses live listing data. Needs templates to produce quality listings first. |
| 9 | Advanced search & filter | More filter options become useful once listing quality (phase 3a) improves. |
| 8 | Trust badge system | Needs KYC (phase 1) and seller level data (already exists) to surface meaningful badges. |

### Phase 4 — Engagement & Retention

| # | Feature | Why last |
|---|---------|-----------|
| 7 | Push notifications | Requires service worker, VAPID keys, FCM setup. High effort infrastructure. |
| 2B | Messaging UI improvements | Typing indicators, attachments, listing share. Nice-to-have on top of a working message flow. |

---

## Technical Dependencies Summary

| Dependency | Required by |
|------------|------------|
| Supabase Storage (file upload) | KYC (1), Messaging attachments (2B), Dispute evidence (4) |
| `web-push` npm package | Push notifications (7) |
| VAPID key pair (env vars) | Push notifications (7) |
| Service worker (`/public/sw.js`) | Push notifications (7) |
| `GAME_RULES` backend constant | Game templates (6) |
| `pushSubscriptions` Prisma model | Push notifications (7) |
| `escrowMilestones` Prisma model | Trust-Trade escrow (4) |
| `savedSearches` Prisma model | Advanced search (9) |
| `GET /auth/validate` endpoint | Auth error handling (10) |
| `POST /checkout/initiate` endpoint | Payment flow (11A) |

---

## Environment Variables Required

New env vars needed across features:

```bash
# Push notifications
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:support@piyrox.shop

# Wallet top-up
WALLET_TOPUP_MAX_USD=500
WALLET_TOPUP_MIN_USD=1

# KYC file upload (if using Supabase Storage)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_KYC_BUCKET=kyc-documents
```

---

## Database Migrations Required

| Migration | Models affected |
|-----------|----------------|
| Add `pushSubscriptions` model | New table `push_subscriptions` |
| Add `savedSearches` model | New table `saved_searches` |
| Add `escrowMilestones` model | New table `escrow_milestones` |
| Add `attachmentUrl`, `attachmentType`, `attachmentName` to `messages` | `messages` table |
| Add `evidenceUrls`, `evidenceText` to `disputes` | `disputes` table |
| Add `phone` to `RegisterDto` (already on `users` model) | No migration needed |
| Add `TOPUP` wallet transaction type | No migration — type is a string field |

All migrations should use `prisma migrate dev --name <description>` in development and `prisma migrate deploy` in production.

---

## Out of Scope

The following are explicitly **not** in scope for this spec:

- Two-factor authentication (2FA) — separate security spec
- Admin panel redesign — admin features are internal tooling
- Cryptocurrency wallet (on-chain) — separate blockchain integration spec
- Referral program changes — affiliate system has its own module
- Subscription/billing changes — Seller Pro pricing is unchanged
- Creator profiles / PiyroxCoins reward system changes
- Forum (`forumThreads`, `forumPosts`) changes
