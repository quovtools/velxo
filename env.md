# Velxo Environment Variables

This document covers all environment variables for the Velxo stack. Variables marked as **Client** are exposed to the browser (via `NEXT_PUBLIC_`), and **Server** variables run only in backend/Node.

## Per-App Summary

| App | Required Variables |
|-----|-------------------|
| `landing` (velxo.shop) | `NEXT_PUBLIC_API_URL` |
| `frontend` (market.velxo.shop) | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `backend` (NestJS API) | See Backend section below |

## Global / Deployment

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Runtime environment: `development`, `production`, or `test` |
| `APP_URL` | Public URL of the main frontend (`market.velxo.shop`) |
| `API_URL` | Public URL of the NestJS backend API |

## Frontend (market.velxo.shop)

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | Client | Backend API base URL (e.g. `https://api.velxo.shop/api/v1`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Supabase anon/public key |

## Landing (velxo.shop)

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | Client | Backend API base URL (e.g. `https://api.velxo.shop/api/v1`) |

> Note: The landing app is primarily marketing. It reads from the API for the blog listing only. All other calls are hardcoded external links.

## Backend — Core

| Variable | Scope | Description |
|----------|-------|-------------|
| `PORT` | Server | NestJS server listen port |
| `CORS_ORIGIN` | Server | Allowed origin(s) for CORS |
| `SUPABASE_URL` | Server | Supabase project URL |
| `SUPABASE_ANON_KEY` | Server | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase service role key (bypasses RLS) |
| `DATABASE_URL` | Server | PostgreSQL connection string |
| `JWT_SECRET` | Server | Secret used to sign/verify JWTs |
| `JWT_EXPIRES_IN` | Server | JWT TTL (e.g. `7d`, `1h`) |
| `SUPABASE_JWT_SECRET` | Server | Supabase JWT secret for verifying access tokens |

## Backend — Payments

| Variable | Scope | Description |
|----------|-------|-------------|
| `FLUTTERWAVE_PUBLIC_KEY` | Server | Flutterwave public key |
| `FLUTTERWAVE_SECRET_KEY` | Server | Flutterwave secret key |
| `FLUTTERWAVE_WEBHOOK_SECRET` | Server | Flutterwave webhook signing secret |
| `PAYMENT_IO_API_KEY` | Server | Payment.io API key (crypto payments) |
| `PAYMENT_IO_WEBHOOK_SECRET` | Server | Payment.io webhook signing secret |

## Backend — Email

| Variable | Scope | Description |
|----------|-------|-------------|
| `RESEND_API_KEY` | Server | Resend API key for transactional email |
| `EMAIL_FROM` | Server | Sender email address |
