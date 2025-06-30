# 🚢 Deployment Issues and Solutions

This guide covers common deployment issues specific to Vercel, Supabase, and production environments.

## 🌐 Vercel Deployment Issues

### Environment Configuration Problems

#### Issue: "Environment variables not accessible in production"

**Symptoms:**

- Build succeeds but app crashes in production
- API routes return 500 errors
- Authentication flows fail

**Solutions:**

1. **Check Vercel Environment Variables:**

   ```bash
   # Vercel Dashboard → Project → Settings → Environment Variables
   # Ensure all required variables are set for "Production"

   Required Variables:
   - DATABASE_URL
   - DIRECT_URL (for Supabase)
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - STRIPE_SECRET_KEY
   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   ```

2. **Verify Environment Variable Scoping:**

   ```bash
   # Variables must be set for correct environment:
   # - Production: for main branch deployments
   # - Preview: for pull request deployments
   # - Development: for local development
   ```

3. **Test Environment Variables:**
   ```javascript
   // Create /api/debug-env.js (temporary, remove after testing)
   export default function handler(req, res) {
     if (process.env.NODE_ENV !== 'production') {
       res.status(200).json({
         hasDatabase: !!process.env.DATABASE_URL,
         hasNextAuth: !!process.env.NEXTAUTH_SECRET,
         hasStripe: !!process.env.STRIPE_SECRET_KEY,
         nodeEnv: process.env.NODE_ENV,
       })
     } else {
       res.status(403).json({ error: 'Not available in production' })
     }
   }
   ```

#### Issue: "NEXTAUTH_URL mismatch in production"

**Symptoms:**

- OAuth redirects fail
- "redirect_uri_mismatch" errors
- Session creation fails

**Solutions:**

1. **Set Correct NEXTAUTH_URL:**

   ```bash
   # In Vercel environment variables
   NEXTAUTH_URL=https://your-app.vercel.app

   # Not localhost or development URLs
   ```

2. **Update OAuth Provider Settings:**

   ```bash
   # Google Cloud Console
   Authorized JavaScript origins:
   - https://your-app.vercel.app

   Authorized redirect URIs:
   - https://your-app.vercel.app/api/auth/callback/google

   # Supabase Dashboard → Authentication → URL Configuration
   Site URL: https://your-app.vercel.app
   Additional redirect URLs: https://your-app.vercel.app/**
   ```

3. **Verify Domain Configuration:**

   ```bash
   # If using custom domain
   NEXTAUTH_URL=https://your-custom-domain.com

   # Update all OAuth providers with custom domain URLs
   ```

### Build and Runtime Errors

#### Issue: "Function execution timed out"

**Symptoms:**

```bash
Task timed out after 10.00 seconds
Function execution duration exceeded
```

**Solutions:**

1. **Optimize API Routes:**

   ```javascript
   // Add timeouts to external API calls
   const controller = new AbortController()
   const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

   try {
     const response = await fetch(apiUrl, {
       method: 'POST',
       signal: controller.signal,
       // ... other options
     })
     clearTimeout(timeoutId)
   } catch (error) {
     if (error.name === 'AbortError') {
       throw new Error('Request timeout')
     }
     throw error
   }
   ```

2. **Configure Vercel Function Timeouts:**

   ```json
   // vercel.json
   {
     "functions": {
       "app/api/face-fusion/route.js": {
         "maxDuration": 300
       }
     }
   }
   ```

3. **Use Background Processing:**
   ```javascript
   // For long-running tasks, use queue-based processing
   // Return immediately and process asynchronously
   res.status(202).json({ message: 'Processing started', jobId: 'xyz' })
   ```

#### Issue: "Memory limit exceeded"

**Symptoms:**

```bash
Process out of memory
JavaScript heap out of memory
```

**Solutions:**

1. **Optimize Memory Usage:**

   ```javascript
   // Avoid loading large files into memory
   // Use streams for file processing

   const fs = require('fs')
   const stream = fs.createReadStream(filePath)
   // Process in chunks instead of loading entire file
   ```

2. **Configure Memory Limits:**

   ```json
   // vercel.json
   {
     "functions": {
       "app/api/**/*.js": {
         "memory": 1024
       }
     }
   }
   ```

3. **Implement File Size Limits:**

   ```javascript
   // Check file sizes before processing
   const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

   if (file.size > MAX_FILE_SIZE) {
     return res.status(400).json({
       error: 'File too large',
       maxSize: '10MB',
     })
   }
   ```

### Database Connection Issues

#### Issue: "Too many database connections"

**Symptoms:**

```bash
Error: sorry, too many clients already
Connection pool exhausted
```

**Solutions:**

1. **Configure Connection Pooling:**

   ```javascript
   // lib/db.js
   import { PrismaClient } from '@prisma/client'

   const globalForPrisma = globalThis

   export const prisma =
     globalForPrisma.prisma ||
     new PrismaClient({
       datasources: {
         db: {
           url: process.env.DATABASE_URL,
         },
       },
     })

   if (process.env.NODE_ENV !== 'production') {
     globalForPrisma.prisma = prisma
   }
   ```

2. **Use Supabase Connection Pooling:**

   ```bash
   # Use DIRECT_URL for migrations and DATABASE_URL for queries
   DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
   ```

3. **Implement Connection Cleanup:**
   ```javascript
   // In API routes
   export default async function handler(req, res) {
     try {
       // Your database operations
       const result = await prisma.user.findMany()
       res.json(result)
     } finally {
       await prisma.$disconnect()
     }
   }
   ```

## 🔐 Authentication Deployment Issues

### OAuth Configuration Problems

#### Issue: "OAuth consent screen errors"

**Solutions:**

1. **Configure OAuth Consent Screen:**

   ```bash
   # Google Cloud Console → OAuth consent screen
   # Add your domain to authorized domains
   # Set app status to "In production" (not testing)
   ```

2. **Verify Scopes:**
   ```javascript
   // Ensure minimal required scopes
   providers: [
     GoogleProvider({
       clientId: process.env.GOOGLE_CLIENT_ID,
       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
       authorization: {
         params: {
           scope: 'openid email profile',
         },
       },
     }),
   ]
   ```

#### Issue: "Session storage problems in production"

**Solutions:**

1. **Configure Session Strategy:**

   ```javascript
   // [...nextauth]/route.js
   export const authOptions = {
     session: {
       strategy: 'database', // Use database sessions in production
       maxAge: 30 * 24 * 60 * 60, // 30 days
     },
     // ... other options
   }
   ```

2. **Verify Database Session Tables:**
   ```sql
   -- Ensure NextAuth.js tables exist
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('accounts', 'sessions', 'users', 'verification_tokens');
   ```

## 💳 Payment Integration Deployment Issues

### Stripe Configuration Problems

#### Issue: "Stripe webhook verification fails"

**Solutions:**

1. **Configure Webhook Endpoint:**

   ```bash
   # Stripe Dashboard → Webhooks → Add endpoint
   # Endpoint URL: https://your-app.vercel.app/api/stripe/webhook
   # Events: checkout.session.completed
   ```

2. **Use Production Webhook Secret:**

   ```bash
   # Get webhook signing secret from Stripe Dashboard
   STRIPE_WEBHOOK_SECRET=whsec_[production_secret]
   ```

3. **Test Webhook Delivery:**
   ```bash
   # Stripe Dashboard → Webhooks → Test webhook
   # Check delivery attempts and response codes
   ```

#### Issue: "Payment processing fails in production"

**Solutions:**

1. **Switch to Live Stripe Keys:**

   ```bash
   # Use live keys for production
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

   # Use live price IDs
   STRIPE_PRICE_ID=price_[live_price_id]
   ```

2. **Test Payment Flow:**
   ```bash
   # Use Stripe test cards even in live mode for testing
   # 4242424242424242 - successful payment
   # 4000000000000002 - card declined
   ```

## 🗄️ Supabase Integration Issues

### Database Connection Problems

#### Issue: "Connection string format errors"

**Solutions:**

1. **Use Correct Connection Strings:**

   ```bash
   # For application queries (with connection pooling)
   DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

   # For migrations (direct connection)
   DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
   ```

2. **Verify Supabase Project Status:**
   ```bash
   # Check Supabase Dashboard
   # Project → Settings → Database
   # Ensure project is active and not paused
   ```

#### Issue: "Row Level Security (RLS) blocking queries"

**Solutions:**

1. **Configure RLS Policies:**

   ```sql
   -- Create policies for authenticated users
   CREATE POLICY "Users can view own data" ON users
   FOR SELECT USING (auth.uid() = id);

   CREATE POLICY "Users can update own data" ON users
   FOR UPDATE USING (auth.uid() = id);
   ```

2. **Use Service Role for API Routes:**
   ```javascript
   // Use service role key for server-side operations
   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL,
     process.env.SUPABASE_SERVICE_ROLE_KEY
   )
   ```

## 🔍 Debugging Production Issues

### Enable Debug Logging

```javascript
// Create debug API route (remove after debugging)
// pages/api/debug.js
export default function handler(req, res) {
  if (process.env.NODE_ENV === 'development') {
    res.status(200).json({
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabase: !!process.env.DATABASE_URL,
        hasNextAuth: !!process.env.NEXTAUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        hasStripe: !!process.env.STRIPE_SECRET_KEY,
      },
      headers: req.headers,
      query: req.query,
    })
  } else {
    res.status(403).json({ error: 'Debug endpoint disabled in production' })
  }
}
```

### Monitor Vercel Functions

```bash
# View function logs in Vercel Dashboard
# Functions → Select function → View logs
# Monitor for errors, timeouts, and performance issues
```

### Health Check Endpoint

```javascript
// pages/api/health.js
export default async function handler(req, res) {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'connected',
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
}
```

## 📋 Pre-deployment Checklist

Before deploying to production:

- [ ] All environment variables configured in Vercel
- [ ] OAuth providers updated with production URLs
- [ ] Database migrations applied to production database
- [ ] Stripe webhooks configured for production domain
- [ ] NEXTAUTH_URL set to production domain
- [ ] SSL certificates valid for custom domains
- [ ] Health check endpoint returning success
- [ ] Error monitoring configured
- [ ] Backup strategy in place

## 🆘 Emergency Procedures

### Rollback Deployment

```bash
# Vercel Dashboard → Deployments → Previous deployment → Promote to Production
# Or use Vercel CLI
vercel rollback [deployment-url]
```

### Quick Fixes

```bash
# Disable problematic features quickly
# Use environment variables to toggle features
FEATURE_FACE_FUSION_ENABLED=false
FEATURE_PAYMENTS_ENABLED=false
```

### Database Emergency Access

```bash
# Direct database access via Supabase Dashboard
# Database → SQL Editor
# Run emergency queries to fix data issues
```

## 📚 Related Documentation

- [build-errors.md](./build-errors.md) - Build-specific issues
- [common-issues.md](./common-issues.md) - General troubleshooting
- [../deployment/vercel-setup.md](../deployment/vercel-setup.md) - Vercel configuration guide
- [../VERCEL_DEPLOYMENT_CHECKLIST.md](../VERCEL_DEPLOYMENT_CHECKLIST.md) - Complete deployment guide

---

**Note**: Always test deployments in a staging environment before going to production. Keep monitoring tools active and have rollback procedures ready.
