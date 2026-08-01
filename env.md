# Piyrox Environment Variables

This document covers all environment variables for the Piyrox stack. Variables marked as **Client** are exposed to the browser (via `NEXT_PUBLIC_`), and **Server** variables run only in backend/Node.

## Per-App Summary

| App | Required Variables |
|-----|-------------------|
| `landing` (piyrox.shop) | `NEXT_PUBLIC_API_URL` |
| `frontend` (app.piyrox.shop) | `NEXT_PUBLIC_API_URL` |
| `backend` (NestJS API) | See Backend section below |

## Global / Deployment

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Runtime environment: `development`, `production`, or `test` |
| `APP_URL` | Public URL of the main frontend (`app.piyrox.shop`) |
| `API_URL` | Public URL of the NestJS backend API |

## Frontend (app.piyrox.shop)

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | Client | Backend API base URL — set to `/api/v1` in production (Next.js proxies to localhost:3001 inside the Fly container) |

## Landing (piyrox.shop)

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | Client | Backend API base URL (e.g. `https://app.piyrox.shop/api/v1`) |

> Note: The landing app is primarily marketing. It reads from the API for the blog listing only. All other calls are hardcoded links to `app.piyrox.shop`.

## Backend — Core

| Variable | Scope | Description |
|----------|-------|-------------|
| `PORT` | Server | NestJS server listen port (default `3001`) |
| `DATABASE_URL` | Server | NeonDB pooled connection string (used by Prisma at runtime) |
| `DIRECT_URL` | Server | NeonDB direct (non-pooled) connection string (used by Prisma migrations) |
| `JWT_SECRET` | Server | Secret used to sign/verify JWTs |
| `JWT_EXPIRES_IN` | Server | JWT TTL (e.g. `7d`, `1h`) |

> **CORS note:** `CORS_ORIGIN` is not required. Frontend and backend run in the same Fly.io container — Next.js proxies all `/api/v1/*` requests to `localhost:3001`, so no cross-origin requests occur. Only set `CORS_ORIGIN` if you add an external API consumer.

## Backend — Payments

| Variable | Scope | Description |
|----------|-------|-------------|
| `FLUTTERWAVE_PUBLIC_KEY` | Server | Flutterwave public key (cards / bank transfer) |
| `FLUTTERWAVE_SECRET_KEY` | Server | Flutterwave secret key |
| `FLUTTERWAVE_WEBHOOK_SECRET` | Server | Flutterwave webhook signing secret |
| `PAYMENT_IO_API_URL` | Server | Payment.io API base URL (e.g. `https://api.paymento.io/v1`) |
| `PAYMENT_IO_API_KEY` | Server | Payment.io API key (crypto payments) |
| `PAYMENT_IO_SECRET_KEY` | Server | Payment.io secret key (used to verify IPN HMAC signature) |
| `PAYMENT_IO_IPN_URL` | Server | Payment.io IPN callback URL (e.g. `https://app.piyrox.shop/api/v1/payments/webhook/paymentio`) |

## Backend — Email

Email uses **Resend as primary** and **Bavimail as automatic fallback**. If Resend returns an error or throws (rate limit, network issue, etc.), the send is retried immediately via Bavimail. At least one provider must be configured.

| Variable | Scope | Description |
|----------|-------|-------------|
| `RESEND_API_KEY` | Server | Resend API key — primary transactional email provider |
| `EMAIL_FROM` | Server | Sender address (e.g. `noreply@piyrox.shop`) |
| `BAVIMAIL_API_KEY` | Server | Bavimail API key — fallback provider |
| `BAVIMAIL_ALIAS_ID` | Server | Bavimail sending alias ID for `noreply@piyrox.shop` (from dashboard → Aliases) |

## Backend — Storage (Backblaze B2)

| Variable | Scope | Description |
|----------|-------|-------------|
| `B2_ENDPOINT` | Server | B2 S3-compatible endpoint URL |
| `B2_REGION` | Server | B2 region (e.g. `us-east-005`) |
| `B2_BUCKET` | Server | B2 bucket name |
| `B2_KEY_ID` | Server | B2 application key ID |
| `B2_APP_KEY` | Server | B2 application key |
| `B2_URL_TTL_SECONDS` | Server | Presigned URL TTL in seconds (default `86400`) |

## Backend — Google OAuth

| Variable | Scope | Description |
|----------|-------|-------------|
| `GOOGLE_CLIENT_ID` | Server | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Server | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Server | OAuth callback URL (e.g. `https://app.piyrox.shop/api/v1/auth/google/callback`) |

## NeonDB Connection Strings

NeonDB provides two connection strings per database — use both:

```
# Pooled (for runtime — goes through connection pooler)
DATABASE_URL=postgresql://neondb_owner:[password]@[pooled-host].neon.tech/neondb?sslmode=require

# Direct (for Prisma migrations — bypasses pooler)
DIRECT_URL=postgresql://neondb_owner:[password]@[direct-host].neon.tech/neondb?sslmode=require
```

Set these as Fly.io secrets:
```sh
fly secrets set DATABASE_URL="postgresql://..." DIRECT_URL="postgresql://..."
```

## Fly.io Secrets — Full Set Command

```sh
fly secrets set \
  DATABASE_URL="postgresql://neondb_owner:[password]@[pooled-host].neon.tech/neondb?sslmode=require" \
  DIRECT_URL="postgresql://neondb_owner:[password]@[direct-host].neon.tech/neondb?sslmode=require" \
  FRONTEND_URL="https://app.piyrox.shop" \
  API_URL="https://app.piyrox.shop" \
  RESEND_API_KEY="re_..." \
  EMAIL_FROM="noreply@piyrox.shop" \
  BAVIMAIL_API_KEY="your-bavimail-api-key" \
  BAVIMAIL_ALIAS_ID="your-bavimail-alias-id" \
  JWT_SECRET="your-jwt-secret"
```
