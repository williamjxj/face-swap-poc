# Vercel Deployment Checklist

## Pre-Deployment Setup

### 1. Supabase Project Setup

- [ ] Create Supabase project at [supabase.com](https://supabase.com)
- [ ] Get project credentials:
  - [ ] Project URL: `https://[PROJECT-ID].supabase.co`
  - [ ] Anon Key: From Settings → API
  - [ ] Service Role Key: From Settings → API
  - [ ] Database URL: From Settings → Database

### 2. OAuth Provider Configuration

#### Google OAuth

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Create OAuth 2.0 credentials
- [ ] Add production redirect URI: `https://your-app.vercel.app/api/auth/callback/google`
- [ ] Get Client ID and Client Secret

#### Azure AD (Optional)

- [ ] Go to [Azure Portal](https://portal.azure.com/)
- [ ] Register new application
- [ ] Add production redirect URI: `https://your-app.vercel.app/api/auth/callback/azure-ad`
- [ ] Get Client ID, Client Secret, and Tenant ID

### 3. Database Migration

- [ ] Run migration script: `./scripts/migrate-to-supabase.sh`
- [ ] Verify schema in Supabase dashboard
- [ ] Test local app with Supabase: `./scripts/switch-db-env.sh supabase`

## Vercel Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"

# Next-Auth
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="[GENERATE-SECURE-SECRET]"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE-ROLE-KEY]"

# OAuth Providers
GOOGLE_CLIENT_ID="[PRODUCTION-GOOGLE-CLIENT-ID]"
GOOGLE_CLIENT_SECRET="[PRODUCTION-GOOGLE-CLIENT-SECRET]"
AZURE_AD_CLIENT_ID="[PRODUCTION-AZURE-CLIENT-ID]"
AZURE_AD_CLIENT_SECRET="[PRODUCTION-AZURE-CLIENT-SECRET]"
AZURE_AD_TENANT_ID="[AZURE-TENANT-ID]"

# Application URLs
NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"

# Modal API (Production)
MODAL_CREATE_API="[PRODUCTION-MODAL-CREATE-API]"
MODAL_QUERY_API="[PRODUCTION-MODAL-QUERY-API]"

# Storage (Vercel uses /tmp)
STORAGE_PATH="/tmp/storage"
```

### Environment Variables Setup in Vercel

1. **Navigate to Vercel Dashboard**

   - Go to your project
   - Click on "Settings" tab
   - Select "Environment Variables"

2. **Add Variables by Environment**

   - **Production**: Set all variables above
   - **Preview**: Copy from production, adjust URLs if needed
   - **Development**: Optional, usually use local .env.local

3. **Generate Secure Secrets**
   ```bash
   # Generate NEXTAUTH_SECRET
   openssl rand -base64 32
   ```

## Deployment Steps

### Step 1: GitHub Repository Setup

- [ ] Push code to GitHub repository
- [ ] Ensure all sensitive files are in `.gitignore`
- [ ] Verify `.env.local` is NOT committed

### Step 2: Vercel Project Creation

- [ ] Connect GitHub repository to Vercel
- [ ] Configure build settings:
  - Framework Preset: Next.js
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`

### Step 3: Environment Variables Configuration

- [ ] Set all required environment variables in Vercel
- [ ] Use production OAuth credentials
- [ ] Use Supabase production database URL

### Step 4: Domain Configuration

- [ ] Set up custom domain (optional)
- [ ] Update NEXTAUTH_URL to match domain
- [ ] Update OAuth redirect URIs with new domain

### Step 5: Database Schema Deployment

- [ ] Run final schema push: `npx prisma db push`
- [ ] Verify all tables exist in Supabase
- [ ] Test database operations

## Post-Deployment Verification

### Functionality Tests

- [ ] **Authentication**

  - [ ] Google OAuth login works
  - [ ] Azure AD login works (if configured)
  - [ ] Credentials login works
  - [ ] Session persistence works
  - [ ] Logout works properly

- [ ] **Database Operations**

  - [ ] User registration creates database records
  - [ ] File uploads work correctly
  - [ ] Face fusion API calls succeed
  - [ ] Generated media saves to database

- [ ] **API Endpoints**
  - [ ] `/api/auth/[...nextauth]` returns 200
  - [ ] `/api/test-db` confirms database connection
  - [ ] Protected API routes require authentication

### Performance Tests

- [ ] **Page Load Times**

  - [ ] Home page loads < 3 seconds
  - [ ] Authentication pages load quickly
  - [ ] Dashboard loads efficiently

- [ ] **Database Performance**
  - [ ] Queries execute within acceptable time
  - [ ] Connection pooling works properly
  - [ ] No timeout errors

## Troubleshooting Common Issues

### Issue 1: OAuth Redirect Mismatch

**Symptoms**: OAuth login fails with redirect URI error
**Solution**:

- Verify redirect URIs in OAuth provider settings
- Ensure NEXTAUTH_URL matches deployed domain
- Check for HTTP vs HTTPS mismatch

### Issue 2: Database Connection Errors

**Symptoms**: 500 errors, "Connection refused"
**Solution**:

- Verify DATABASE_URL format is correct
- Check Supabase project is active
- Ensure database allows external connections

### Issue 3: Environment Variables Not Loading

**Symptoms**: Undefined environment variables in production
**Solution**:

- Verify variables are set in Vercel dashboard
- Check variable names match exactly
- Redeploy after adding new variables

### Issue 4: Prisma Client Issues

**Symptoms**: "Prisma client not found" errors
**Solution**:

- Ensure `npx prisma generate` runs in build process
- Check if schema.prisma is included in deployment
- Verify database schema matches Prisma schema

## Environment Comparison

| Feature  | Local Dev        | Supabase Dev    | Vercel Prod         |
| -------- | ---------------- | --------------- | ------------------- |
| Database | Local PostgreSQL | Remote Supabase | Remote Supabase     |
| URL      | localhost:3000   | localhost:3000  | your-app.vercel.app |
| OAuth    | Dev credentials  | Dev credentials | Prod credentials    |
| Storage  | ./storage        | ./storage       | /tmp/storage        |
| Secrets  | .env.local       | .env.local      | Vercel env vars     |

## Rollback Plan

### If Deployment Fails

1. **Revert Code**

   ```bash
   git revert [commit-hash]
   git push origin main
   ```

2. **Database Rollback**

   ```bash
   # Restore from backup if needed
   psql "[SUPABASE-URL]" < backup.sql
   ```

3. **Environment Rollback**
   - Revert environment variables in Vercel
   - Update OAuth redirect URIs if changed

### Emergency Contacts

- Supabase Support: [support.supabase.com](https://support.supabase.com)
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- OAuth Provider Documentation

## Success Criteria

- [ ] All authentication methods work
- [ ] Database operations complete successfully
- [ ] No console errors in production
- [ ] Application loads within performance targets
- [ ] All API endpoints respond correctly

**Deployment Complete! 🚀**
