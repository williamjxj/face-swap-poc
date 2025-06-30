# 🔍 Common Issues and Solutions

This guide covers frequently encountered issues and their solutions for the Face Swap POC application.

## 🚨 Critical Issues

### Database Connection Issues

#### Issue: "Database connection failed" or "DATABASE_URL not found"

**Symptoms:**

```bash
Error: Environment variable not found: DATABASE_URL
PrismaClientInitializationError: Can't reach database server
```

**Solutions:**

1. **Check Environment Variables:**

   ```bash
   # Verify DATABASE_URL is set
   echo $DATABASE_URL

   # Check .env files
   cat .env.local
   cat .env
   ```

2. **Verify Database Status:**

   ```bash
   # For Supabase - check dashboard
   # For local PostgreSQL
   pg_isready -h localhost -p 5432
   ```

3. **Fix Environment Configuration:**

   ```bash
   # Copy from template
   cp .env.example .env.local

   # Use environment switcher
   ./scripts/switch-db-env.sh remote
   ```

4. **Test Connection:**
   ```bash
   # Test with psql
   psql $DATABASE_URL -c "SELECT 1;"
   ```

#### Issue: Prisma Client not generated

**Symptoms:**

```bash
Error: @prisma/client did not initialize yet
Cannot find module '@prisma/client'
```

**Solutions:**

1. **Generate Prisma Client:**

   ```bash
   npx prisma generate
   ```

2. **Reinstall Dependencies:**

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npx prisma generate
   ```

3. **Verify Schema:**
   ```bash
   npx prisma validate
   npx prisma format
   ```

## 🔧 Build and Deployment Issues

### Next.js Build Failures

#### Issue: Build fails with missing environment variables

**Symptoms:**

```bash
Error: Missing required environment variables during build
TypeError: Cannot read properties of undefined
```

**Solutions:**

1. **Add Build-time Environment Variables:**

   ```javascript
   // next.config.js
   module.exports = {
     env: {
       DATABASE_URL: process.env.DATABASE_URL || 'postgresql://fallback',
       NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'fallback-secret',
     },
   }
   ```

2. **Use Build Verification Script:**

   ```bash
   ./scripts/verify-build.sh
   ```

3. **Check Vercel Environment Variables:**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Ensure all required variables are set for production

#### Issue: TypeScript/ESLint errors during build

**Symptoms:**

```bash
Type error: Property 'x' does not exist on type 'y'
ESLint: 'variable' is assigned a value but never used
```

**Solutions:**

1. **Fix TypeScript Errors:**

   ```bash
   # Check for type issues
   npx tsc --noEmit

   # Update types if needed
   npm run lint-fix
   ```

2. **Update ESLint Configuration:**
   ```javascript
   // eslint.config.mjs
   export default [
     {
       rules: {
         '@typescript-eslint/no-unused-vars': [
           'error',
           {
             argsIgnorePattern: '^_',
             varsIgnorePattern: '^_',
           },
         ],
       },
     },
   ]
   ```

### Vercel Deployment Issues

#### Issue: Deployment succeeds but application doesn't work

**Symptoms:**

- Build succeeds but app shows errors
- Authentication redirects fail
- API routes return 500 errors

**Solutions:**

1. **Check Environment Variables in Production:**

   ```bash
   # Verify NEXTAUTH_URL matches deployment URL
   NEXTAUTH_URL=https://your-app.vercel.app

   # Check OAuth redirect URLs in providers
   ```

2. **Update OAuth Provider Settings:**

   ```bash
   # Google Console
   Authorized JavaScript origins: https://your-app.vercel.app
   Authorized redirect URIs: https://your-app.vercel.app/api/auth/callback/google

   # Supabase Dashboard
   Site URL: https://your-app.vercel.app
   ```

3. **Check Function Logs:**
   ```bash
   # In Vercel Dashboard → Functions → View logs
   # Look for runtime errors and missing environment variables
   ```

## 🔐 Authentication Issues

### NextAuth.js Problems

#### Issue: "Cannot read properties of null (reading 'user')"

**Symptoms:**

```bash
TypeError: Cannot read properties of null (reading 'user')
Session is null unexpectedly
```

**Solutions:**

1. **Check Session Provider:**

   ```jsx
   // Ensure AuthProvider wraps your app
   // src/app/layout.js
   import { AuthProvider } from '@/components/AuthProvider'

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           <AuthProvider>{children}</AuthProvider>
         </body>
       </html>
     )
   }
   ```

2. **Verify NEXTAUTH_SECRET:**

   ```bash
   # Generate new secret if needed
   openssl rand -base64 32
   ```

3. **Check OAuth Configuration:**
   ```bash
   # Verify client IDs and secrets are correct
   echo $GOOGLE_CLIENT_ID
   echo $GOOGLE_CLIENT_SECRET
   ```

#### Issue: OAuth redirect loop or "redirect_uri_mismatch"

**Solutions:**

1. **Update OAuth Provider Settings:**

   ```bash
   # Match exact URLs in OAuth providers
   # No trailing slashes
   # HTTPS in production, HTTP in development
   ```

2. **Check NEXTAUTH_URL:**

   ```bash
   # Development
   NEXTAUTH_URL=http://localhost:3000

   # Production
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```

3. **Clear Browser Cookies/Cache:**
   ```bash
   # Sometimes cached auth state causes issues
   # Clear cookies for localhost:3000 or production domain
   ```

## 💳 Payment Integration Issues

### Stripe Configuration Problems

#### Issue: "No such price" or "Invalid API key"

**Solutions:**

1. **Verify Stripe Configuration:**

   ```bash
   # Check API keys match environment (test vs live)
   echo $STRIPE_SECRET_KEY
   echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

   # Verify price ID exists in Stripe dashboard
   echo $STRIPE_PRICE_ID
   ```

2. **Test Stripe Connection:**
   ```bash
   # Create test script to verify Stripe API
   node -e "
   const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
   stripe.prices.retrieve(process.env.STRIPE_PRICE_ID)
     .then(price => console.log('✅ Stripe configuration valid'))
     .catch(err => console.error('❌ Stripe error:', err.message));
   "
   ```

#### Issue: Webhook signature verification failed

**Solutions:**

1. **Update Webhook Secret:**

   ```bash
   # Get webhook secret from Stripe Dashboard
   # Webhooks → Select endpoint → Signing secret
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

2. **Test Webhook Locally:**
   ```bash
   # Use ngrok for local webhook testing
   ngrok http 3000
   # Update webhook URL in Stripe to ngrok URL
   ```

## 🎥 Face Fusion API Issues

### External API Integration Problems

#### Issue: Face fusion processing fails or times out

**Symptoms:**

```bash
Error: Request timeout
Error: Invalid response from face fusion API
```

**Solutions:**

1. **Check API Endpoints:**

   ```bash
   # Verify API URLs are correct
   echo $FACEFUSION_API_URL
   echo $FACEFUSION_DOWNLOAD_URL

   # Test API connectivity
   curl -X GET $FACEFUSION_API_URL/health
   ```

2. **Increase Timeout Values:**

   ```javascript
   // In API route
   const response = await fetch(apiUrl, {
     method: 'POST',
     body: formData,
     signal: AbortSignal.timeout(300000), // 5 minutes
   })
   ```

3. **Check File Size Limits:**
   ```javascript
   // Verify file sizes are within API limits
   const maxFileSize = 10 * 1024 * 1024 // 10MB
   if (file.size > maxFileSize) {
     throw new Error('File too large')
   }
   ```

## 📱 Frontend Issues

### React/UI Problems

#### Issue: Hydration mismatch errors

**Symptoms:**

```bash
Warning: Text content did not match. Server: "x" Client: "y"
Error: Hydration failed because the initial UI does not match
```

**Solutions:**

1. **Use Dynamic Imports for Client-only Components:**

   ```jsx
   import dynamic from 'next/dynamic'

   const ClientOnlyComponent = dynamic(() => import('./ClientOnlyComponent'), { ssr: false })
   ```

2. **Check for Browser-specific Code:**
   ```jsx
   // Use useEffect for client-side only code
   useEffect(() => {
     // Client-side only code here
   }, [])
   ```

#### Issue: Images not loading or showing broken links

**Solutions:**

1. **Check Image Paths:**

   ```jsx
   // Use Next.js Image component
   import Image from 'next/image'

   ;<Image src="/path/to/image.jpg" alt="Description" width={400} height={300} />
   ```

2. **Verify Public Directory Structure:**
   ```bash
   # Ensure images are in public directory
   ls -la public/assets/
   ls -la public/thumbnails/
   ```

## 🔄 Performance Issues

### Slow Loading or High Resource Usage

#### Issue: Application loads slowly

**Solutions:**

1. **Enable Next.js Optimization:**

   ```bash
   # Use Turbopack for development
   npm run dev  # Already includes --turbopack
   ```

2. **Optimize Images:**

   ```jsx
   // Use Next.js Image optimization
   <Image
     src="/image.jpg"
     alt="Description"
     width={400}
     height={300}
     loading="lazy"
     placeholder="blur"
   />
   ```

3. **Check Database Query Performance:**
   ```javascript
   // Add indexes for commonly queried fields
   // Use Prisma Studio to analyze query performance
   ```

## 🛠️ Development Environment Issues

### Local Development Problems

#### Issue: Port 3000 already in use

**Solutions:**

1. **Kill Existing Process:**

   ```bash
   lsof -ti:3000 | xargs kill -9
   # Or
   pkill -f "next"
   ```

2. **Use Different Port:**
   ```bash
   npm run dev -- -p 3001
   ```

#### Issue: Supabase local instance not starting

**Solutions:**

1. **Reset Supabase:**

   ```bash
   supabase stop
   supabase start
   ```

2. **Check Docker:**
   ```bash
   docker ps
   docker system prune
   ```

## 📋 Diagnostic Commands

### Quick Health Check

```bash
#!/bin/bash
# scripts/health-check.sh

echo "🔍 Running health checks..."

# Check environment
echo "📁 Environment files:"
ls -la .env*

# Check database connection
echo "💾 Database connection:"
npx prisma migrate status

# Check Node modules
echo "📦 Dependencies:"
npm list --depth=0 | grep -E "(prisma|next|react)"

# Check ports
echo "🔌 Port usage:"
lsof -i :3000 || echo "Port 3000 is free"

echo "✅ Health check completed"
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Next.js debug mode
NEXT_DEBUG=1 npm run dev

# Prisma debug mode
DEBUG="prisma:*" npm run dev
```

## 📚 Getting Help

### When to Escalate

1. **Data Loss or Corruption** - Immediate escalation
2. **Security Vulnerabilities** - High priority
3. **Production Outages** - Immediate escalation
4. **Performance Degradation** - Monitor and escalate if persistent

### Support Resources

- **Documentation**: Check related docs in this repository
- **Logs**: Always include relevant log output
- **Environment**: Specify development vs production
- **Steps to Reproduce**: Provide clear reproduction steps

---

**Note**: When reporting issues, always include relevant log output, environment details, and steps to reproduce the problem. This helps in faster resolution.
