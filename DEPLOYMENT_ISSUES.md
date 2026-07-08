# Deployment Issues - Velxo Backend on Render

## Issues Identified

### 1. JWT "jwt malformed" Errors (401 Unauthorized)

**Problem:** All protected endpoints return `401 | Invalid or expired token` with "jwt malformed" in logs.

**Root Cause:** 
- JWT tokens were signed with one secret key but are being verified with a different key
- The `JWT_SECRET` environment variable in Render likely differs from what was used when tokens were created
- The AuthController and JwtAuthGuard were using hardcoded fallbacks inconsistently

**Solution Applied:**
- Updated `auth.module.ts` to use `JwtModule.registerAsync()` with `ConfigService`
- Updated `jwt-auth.guard.ts` to use `ConfigService` for secret retrieval
- All JWT operations now use the same secret from environment configuration

### 2. Google OAuth "Authentication Failed"

**Problem:** Google OAuth callback returns `Error: Google authentication failed`

**Root Cause:**
- `GOOGLE_REDIRECT_URI` in Google Console doesn't match what's being sent
- Missing or incorrect `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in Render environment

**Configuration Required:**
In Google Cloud Console (https://console.cloud.google.com/):
1. Navigate to APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URIs:
   - `https://velxo.onrender.com/api/v1/auth/google/callback`
   - `https://api.velxo.shop/api/v1/auth/google/callback`
4. Copy Client ID and Client Secret

## Required Environment Variables for Render

Add these to your Render deployment (Dashboard → Your Service → Environment):

| Variable | Example | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `super-long-random-string-32-chars-min` | MUST match what was used when tokens were created |
| `GOOGLE_CLIENT_ID` | `123456789-abc123xyz.apps.googleusercontent.com` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxxxxxxxxxx` | From Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | `https://velxo.onrender.com/api/v1/auth/google/callback` | Must match Google Console exactly |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | Supabase or Render PostgreSQL |
| `RESEND_API_KEY` | `re_123456789_xxxxxxxx` | Required for password reset emails |

## Steps to Fix

### For JWT Issues:

1. **Check your current JWT_SECRET:**
   ```bash
   # In your Render service environment variables, check if JWT_SECRET is set
   ```

2. **If tokens were created with a different secret:**
   - All existing tokens will be invalidated (users will need to login again)
   - This is expected behavior for security
   - Set `JWT_SECRET` to a strong, unique value:
     ```bash
     # Generate a secure secret (Linux/Mac)
     openssl rand -base64 64
     
     # Or use Node.js
     node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
     ```

3. **Deploy with the correct JWT_SECRET:**
   - Set it in Render's Environment tab
   - Redeploy the service

### For Google OAuth:

1. **Verify Google Cloud Console settings:**
   - Redirect URI must EXACTLY match: `https://velxo.onrender.com/api/v1/auth/google/callback`
   - Include trailing `/` if present in the code

2. **Set environment variables in Render:**
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`

3. **Update frontend to handle the redirect:**
   - The callback redirects to frontend with token in hash: `https://market.velxo.shop/auth/callback#token=...`
   - Ensure frontend has route handler for `/auth/callback`

### Code Changes Made:

1. **`auth.service.ts`** - Cleaned up duplicate code, unified email service integration
2. **`auth.module.ts`** - Updated JwtModule to use ConfigService for consistent secret retrieval
3. **`jwt-auth.guard.ts`** - Updated to use ConfigService instead of process.env directly

## Testing After Fix

1. **Test JWT authentication:**
   ```bash
   # Login and get token
   curl -X POST https://velxo.onrender.com/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
   
   # Use token to access protected endpoint
   curl https://velxo.onrender.com/api/v1/auth/me \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

2. **Test Google OAuth:**
   - Visit: `https://velxo.onrender.com/api/v1/auth/google`
   - Should redirect to Google consent screen
   - After approval, should redirect to frontend with token

## Important Notes

- **Render free tier** spins down after inactivity (15 min). First request after spin-up may take longer.
- **Database connection**: Ensure `DATABASE_URL` is configured correctly in Render
- **CORS**: Make sure your frontend URL is in `CORS_ORIGIN` environment variable
