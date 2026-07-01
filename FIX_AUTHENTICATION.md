# Fix for Authentication Issues

## Problem
The backend API is returning 401 Unauthorized errors on `/auth/login` and `/auth/refresh` endpoints due to missing or incorrect JWT secret key in the Vercel environment.

## Root Cause
The Vercel deployment of your backend is missing the `SECRET_KEY` environment variable, which is required for JWT token verification.

## Solution

### 1. Update Vercel Environment Variables (Required for Production)
Go to your Vercel project dashboard:
**https://vercel.com/[your-team]/[your-project]/settings/environment-variables**

Add these environment variables for your **backend** project:

| Key | Value | Description |
|-----|-------|-------------|
| `SECRET_KEY` | `675fffb828b61e09924eabe09bf7f7c87d0fdcead0e79088883313dd9069e790` | Must match your backend/.env value |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Access token expiry |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token expiry |
| `ML_DETECTION_ENABLED` | `true` | Enable ML detection |
| `DEFAULT_RISK_THRESHOLD` | `60` | Default risk threshold |
| `CACHE_SIZE` | `1000` | Cache size |
| `TRUSTED_HOSTS` | `promptshield-api-topaz.vercel.app,localhost,127.0.0.1` | Trusted hosts |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Your frontend URL |
| `ENVIRONMENT` | `production` | Environment |
| `DEBUG` | `false` | Debug mode |

### 2. For Local Development with Vercel CLI
Your `backend/.env.production.local` file has already been updated with the correct `SECRET_KEY`.

### 3. After Setting Variables
1. Redeploy your backend on Vercel
2. Clear your browser cache or use incognito mode
3. Try logging in again at your frontend URL

## Files Modified
- `backend/.env.production.local` - Updated with correct SECRET_KEY for local Vercel development
- `backend/vercel.json` - Added documentation about required environment variables

## Verification
After setting the environment variables and redeploying, you should see:
- POST `/api/auth/login` returns 200 instead of 401
- POST `/api/auth/refresh` returns 200 instead of 401
- Successful login and token refresh in your application