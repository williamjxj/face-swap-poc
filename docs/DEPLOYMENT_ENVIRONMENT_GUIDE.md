# Environment Variables in Next.js - Deployment Guide

## Environment File Priority (in order)

1. `.env.local` - Always loaded (except in test environment)
2. `.env.development` - Loaded when NODE_ENV=development
3. `.env.production` - Loaded when NODE_ENV=production
4. `.env` - Always loaded (lowest priority)

## Build vs Runtime Environment Variables

### Build Time (Static Generation)

- Variables are baked into the build during `npm run build`
- Required for: Database connections, API calls in `getStaticProps`, server components
- Must be available in the deployment environment when building

### Runtime (Server/Client)

- Server-side variables: Available only on the server
- Client-side variables: Must be prefixed with `NEXT_PUBLIC_`

## Vercel Deployment Configuration

### 1. Environment Variables Setup in Vercel Dashboard

```bash
# Go to your Vercel project dashboard
# Navigate to: Settings > Environment Variables
# Add these variables for different environments:

# Production Environment
DATABASE_URL=postgresql://postgres:password@prod-db.supabase.co:5432/postgres
NEXTAUTH_SECRET=your-production-secret
MODAL_CREATE_API=https://your-production-modal-api.com/create
MODAL_QUERY_API=https://your-production-modal-api.com/query

# Preview Environment (optional - for PR previews)
DATABASE_URL=postgresql://postgres:password@staging-db.supabase.co:5432/postgres
NEXTAUTH_SECRET=your-staging-secret

# Development Environment (optional - usually use .env.local)
DATABASE_URL=postgresql://postgres:password@dev-db.supabase.co:5432/postgres
```

### 2. Create .env.production for Production Builds

```bash
# This file is used when NODE_ENV=production
NODE_ENV=production
NEXTAUTH_URL=https://your-production-domain.vercel.app
NEXT_PUBLIC_BASE_URL=https://your-production-domain.vercel.app
```

## Common Deployment Issues & Solutions

### Issue 1: Build Fails on Vercel

**Cause**: Missing environment variables during build
**Solution**: Ensure DATABASE_URL is set in Vercel's environment variables

### Issue 2: App Works Locally but Fails on Vercel

**Cause**: Different environment variables between local and production
**Solution**: Check Vercel environment variables match your local .env.local

### Issue 3: Database Connection Errors

**Cause**: Wrong DATABASE_URL or network restrictions
**Solution**:

- Verify DATABASE_URL format
- Check if database allows external connections
- Ensure proper SSL configuration for production databases

## Best Practices

1. **Never commit sensitive .env files**

   - `.env.local` should be in .gitignore
   - `.env.production` can be committed if it only contains non-sensitive defaults

2. **Use environment-specific variables**

   - Different DATABASE_URL for dev/staging/production
   - Different API endpoints for different environments

3. **Test locally with production-like settings**

   ```bash
   NODE_ENV=production npm run build
   NODE_ENV=production npm start
   ```

4. **Use Vercel CLI for testing**
   ```bash
   vercel env pull .env.local  # Download env vars from Vercel
   npm run build              # Test build with production env vars
   ```

## Debugging Deployment Issues

### Check Build Logs

- Look for missing environment variables
- Check for Prisma connection errors
- Verify all imports resolve correctly

### Test Environment Variables

```javascript
// Add to a test API route: /api/debug/env
export async function GET() {
  return Response.json({
    NODE_ENV: process.env.NODE_ENV,
    hasDatabase: !!process.env.DATABASE_URL,
    // Don't log sensitive values in production!
  })
}
```

### Common Vercel Environment Variable Errors

- `PrismaClientConstructorValidationError` - Missing DATABASE_URL
- `Module not found` - Missing build-time environment variables
- `Network timeout` - Database connection issues
