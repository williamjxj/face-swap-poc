# Vercel Deployment Guide

## Overview

This guide covers deploying the Face Swap POC application to Vercel with Supabase as the database backend and NextAuth for authentication.

## Prerequisites

1. **Supabase Project**: Create a project at [supabase.com](https://supabase.com)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **OAuth Providers**: Set up Google OAuth (and optionally Azure AD)

## Required Environment Variables

### Supabase Configuration

```bash
# Supabase Database (both needed for NextAuth adapter)
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Supabase Client (Public)
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

**Important**: The NextAuth Supabase adapter requires `NEXT_PUBLIC_SUPABASE_URL` (not `SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY`.

### NextAuth Configuration

```bash
# NextAuth
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-secure-random-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Azure AD OAuth (Optional)
AZURE_AD_CLIENT_ID="your-azure-client-id"
AZURE_AD_CLIENT_SECRET="your-azure-client-secret"
AZURE_AD_TENANT_ID="your-azure-tenant-id"
```

### Payment Integration (Optional)

```bash
# Stripe
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# PayPal
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
```

## Database Setup

1. **Apply Schema**: Run the SQL in `supabase_schema.sql` in your Supabase SQL Editor
2. **Enable RLS**: Row Level Security policies are included in the schema
3. **Storage Buckets**: Create the following buckets in Supabase Storage:
   - `face-sources`
   - `template-videos`
   - `template-thumbnails`
   - `generated-outputs`

## Vercel Deployment Steps

### 1. Connect Repository

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository root

### 2. Configure Build Settings

Vercel should auto-detect Next.js. Verify these settings:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3. Add Environment Variables

In Vercel dashboard → Project Settings → Environment Variables, add all the variables listed above.

**Important**:

- Use the **Production** environment for live deployment
- Use **Preview** for staging/testing
- Variables starting with `NEXT_PUBLIC_` are exposed to the client

### 4. Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Test the deployment

## OAuth Provider Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```

### Azure AD (Optional)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to Azure Active Directory → App registrations
3. Create new registration
4. Add redirect URI:
   ```
   https://your-app.vercel.app/api/auth/callback/azure-ad
   ```

## Supabase Storage Configuration

### Bucket Policies

Apply these policies for each storage bucket:

```sql
-- Allow authenticated users to upload to face-sources
CREATE POLICY "Users can upload face sources" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'face-sources' AND auth.role() = 'authenticated');

-- Allow public read access to template files
CREATE POLICY "Public read access to templates" ON storage.objects
FOR SELECT USING (bucket_id IN ('template-videos', 'template-thumbnails'));

-- Allow authenticated users to read their generated outputs
CREATE POLICY "Users can read their outputs" ON storage.objects
FOR SELECT USING (bucket_id = 'generated-outputs' AND auth.role() = 'authenticated');
```

## Testing Deployment

### 1. Health Check

Visit: `https://your-app.vercel.app/api/health`

Expected response:

```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-01-04T..."
}
```

### 2. Authentication Test

1. Visit: `https://your-app.vercel.app/auth/signin`
2. Test Google OAuth login
3. Verify user creation in Supabase

### 3. Database Operations

1. Upload a face source
2. View templates
3. Test face fusion (if configured)

## Troubleshooting

### Common Issues

1. **401 Unauthorized from Supabase**
   - Check `SUPABASE_SERVICE_ROLE_KEY` is correct
   - Verify RLS policies are applied

2. **NextAuth Callback Errors**
   - Ensure `NEXTAUTH_URL` matches your Vercel domain
   - Check OAuth provider redirect URIs

3. **Build Failures**
   - Verify all required environment variables are set
   - Check for TypeScript/ESLint errors

### Debug Endpoints

- `/api/debug-env` - Check environment variables
- `/api/debug-auth` - Test authentication
- `/api/debug-db` - Test database connection

## Security Considerations

1. **Environment Variables**: Never commit secrets to git
2. **RLS Policies**: Ensure proper row-level security
3. **CORS**: Configure Supabase CORS for your domain
4. **Rate Limiting**: Consider implementing rate limiting for API routes

## Performance Optimization

1. **Edge Functions**: Consider Vercel Edge Functions for auth
2. **Image Optimization**: Use Next.js Image component
3. **Caching**: Implement proper caching strategies
4. **Database Indexing**: Ensure proper indexes in Supabase

## Monitoring

1. **Vercel Analytics**: Enable in project settings
2. **Supabase Logs**: Monitor database performance
3. **Error Tracking**: Consider Sentry integration

## Next Steps

After successful deployment:

1. Set up custom domain
2. Configure SSL certificate
3. Set up monitoring and alerts
4. Implement backup strategies
5. Plan scaling considerations
