# Environment Configuration Guide

## Overview

The application uses environment variables to switch between development and production modes. By default, it runs in **production mode** unless explicitly set to `dev`.

## Environment Variables

### Backend (Python/FastAPI)

#### Required Variables

- `ENVIRONMENT`: Set to `dev` for local development, or `prod` (default) for production
- `FRONTEND_ORIGIN`: **Required in production**. The frontend URL (e.g., `https://getastro.ca`)
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (optional but recommended)

#### Development Mode (`ENVIRONMENT=dev`)

- Automatically uses `http://localhost:3000` for frontend origin
- Allows CORS from `http://localhost:3000` and `http://127.0.0.1:3000`
- OAuth redirects go to `http://localhost:3000/auth/callback`

#### Production Mode (`ENVIRONMENT=prod` or not set)

- **Requires** `FRONTEND_ORIGIN` to be set (e.g., `https://getastro.ca`)
- Only allows CORS from the configured `FRONTEND_ORIGIN`
- OAuth redirects go to `{FRONTEND_ORIGIN}/auth/callback`

### Frontend (Next.js)

#### Required Variables

- `NEXT_PUBLIC_ENVIRONMENT`: Set to `dev` for local development, or `prod` (default) for production
- `NEXT_PUBLIC_BACKEND_URL`: **Required in production**. The backend API URL (e.g., `https://tryastro.onrender.com`)

#### Development Mode (`NEXT_PUBLIC_ENVIRONMENT=dev`)

- Automatically uses `http://localhost:8000` for backend API calls
- No need to set `NEXT_PUBLIC_BACKEND_URL`

#### Production Mode (`NEXT_PUBLIC_ENVIRONMENT=prod` or not set)

- **Requires** `NEXT_PUBLIC_BACKEND_URL` to be set
- Will show a console warning if not set (but defaults to localhost for backwards compatibility)

## Setup Instructions

### Local Development

1. **Backend `.env` file:**

   ```bash
   ENVIRONMENT=dev
   FRONTEND_ORIGIN=https://getastro.ca  # Optional, not used in dev mode
   # ... other required variables
   ```

2. **Frontend `.env.local` file:**
   ```bash
   NEXT_PUBLIC_ENVIRONMENT=dev
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000  # Optional, not used in dev mode
   # ... other variables
   ```

### Production

1. **Backend `.env` file (on Render/Vercel/etc):**

   ```bash
   ENVIRONMENT=prod  # or omit (defaults to prod)
   FRONTEND_ORIGIN=https://getastro.ca  # REQUIRED
   # ... other required variables
   ```

2. **Frontend `.env` file (on Vercel/etc):**
   ```bash
   NEXT_PUBLIC_ENVIRONMENT=prod  # or omit (defaults to prod)
   NEXT_PUBLIC_BACKEND_URL=https://tryastro.onrender.com  # REQUIRED
   # ... other variables
   ```

## Important Notes

1. **Default is Production**: If `ENVIRONMENT` or `NEXT_PUBLIC_ENVIRONMENT` is not set, the app runs in production mode
2. **Production Requires URLs**: In production mode, `FRONTEND_ORIGIN` and `NEXT_PUBLIC_BACKEND_URL` must be set
3. **Supabase Redirect URLs**: Make sure both localhost and production callback URLs are registered in Supabase:
   - `http://localhost:3000/auth/callback` (for dev)
   - `https://getastro.ca/auth/callback` (for prod)
4. **Restart Required**: Always restart servers after changing environment variables

## Troubleshooting

- **CORS errors**: Check that `ENVIRONMENT` is set correctly and CORS origins match
- **OAuth redirects to wrong URL**: Verify `ENVIRONMENT` and `FRONTEND_ORIGIN` are set correctly
- **API calls going to wrong backend**: Check `NEXT_PUBLIC_ENVIRONMENT` and `NEXT_PUBLIC_BACKEND_URL`
