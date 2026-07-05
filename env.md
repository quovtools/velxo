# Velxo Environment Variables

## Global

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Runtime environment: `development`, `production`, or `test` |
| `APP_URL` | Public URL of the frontend |
| `API_URL` | Public URL of the NestJS backend API |

## Frontend (Next.js)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (exposed to browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key (exposed to browser) |
| `NEXT_PUBLIC_API_URL` | Backend API base URL (exposed to browser) |

## Backend — Core

| Variable | Description |
|----------|-------------|
| `PORT` | NestJS server listen port |
| `CORS_ORIGIN` | Allowed origin(s) for CORS |
| `SUPABASE_URL` | Supabase project URL (server-side) |
| `SUPABASE_ANON_KEY` | Supabase anon key (server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side, bypasses RLS) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign/verify JWTs |
| `JWT_EXPIRES_IN` | JWT TTL (e.g. `7d`, `1h`) |

## Backend — Storage

| Variable | Description |
|----------|-------------|
| `AWS_REGION` | AWS region for S3 or compatible storage |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_S3_BUCKET` | S3 bucket name for media uploads |

## Backend — Redis

| Variable | Description |
|----------|-------------|
| `REDIS_HOST` | Redis host |
| `REDIS_PORT` | Redis port |
| `REDIS_PASSWORD` | Redis password (optional) |

## Backend — Payments

| Variable | Description |
|----------|-------------|
| `FLUTTERWAVE_PUBLIC_KEY` | Flutterwave public key |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave secret key |
| `FLUTTERWAVE_WEBHOOK_SECRET` | Flutterwave webhook signing secret |
| `PAYMENT_IO_API_KEY` | Payment.io API key (crypto payments) |
| `PAYMENT_IO_WEBHOOK_SECRET` | Payment.io webhook signing secret |

## Backend — Email

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key for transactional email |
| `EMAIL_FROM` | Sender email address |

## Backend — Supabase Auth

| Variable | Description |
|----------|-------------|
| `SUPABASE_JWT_SECRET` | Supabase JWT secret for verifying access tokens |
