# 🌍 Environment Variables Configuration

This guide covers environment variable management for different deployment scenarios: local development, GitHub Codespaces, and Vercel production.

## 📋 Environment Files Overview

| File              | Purpose              | Usage                            |
| ----------------- | -------------------- | -------------------------------- |
| `.env`            | Base configuration   | Development defaults             |
| `.env.local`      | Local development    | Overrides for local machine      |
| `.env.production` | Production overrides | Vercel-specific values           |
| `.env.example`    | Template file        | Reference for required variables |

## 🔧 Required Environment Variables

### Database Configuration

```bash
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
DIRECT_URL="postgresql://username:password@localhost:5432/database_name"  # For Supabase

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Authentication (NextAuth.js)

```bash
# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"  # Update for production
NEXTAUTH_SECRET="your-secret-key-min-32-chars"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Microsoft OAuth (optional)
AZURE_AD_CLIENT_ID="your-azure-client-id"
AZURE_AD_CLIENT_SECRET="your-azure-client-secret"
AZURE_AD_TENANT_ID="your-azure-tenant-id"
```

### Payment Processing

```bash
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_..." # or sk_live_... for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..." # or pk_live_... for production
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID="price_1234567890abcdef"
```

### Application Configuration

```bash
# Application URLs
NEXT_PUBLIC_BASE_URL="http://localhost:3000"  # Update for production
NEXT_PUBLIC_APP_URL="http://localhost:3000"   # Update for production

# Face Fusion API
FACEFUSION_API_URL="https://aceswap--facefusion-agent-facefusionagent-index.modal.run"
FACEFUSION_DOWNLOAD_URL="https://aceswap--facefusion-agent-facefusionagent-download-file.modal.run"
```

## 🏠 Local Development Setup

### 1. Copy Template

```bash
cp .env.example .env.local
```

### 2. Configure Local Variables

```bash
# .env.local
DATABASE_URL="postgresql://postgres:password@localhost:5432/facefusion"
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-local-anon-key"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

## 🚀 GitHub Codespaces Configuration

### Automatic Setup

When working in GitHub Codespaces, environment variables are managed through:

1. **Repository Secrets** (for sensitive data)
2. **Codespaces Secrets** (for user-specific data)
3. **devcontainer.json** (for development configuration)

### Setting Up Codespaces

1. **Add Repository Secrets:**

   ```bash
   # Go to GitHub repo → Settings → Secrets and variables → Codespaces
   # Add these secrets:
   NEXTAUTH_SECRET
   GOOGLE_CLIENT_SECRET
   STRIPE_SECRET_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Update OAuth Redirects:**

   ```bash
   # Google Console: Add Codespaces URL
   https://your-codespace-url.app.github.dev/api/auth/callback/google

   # Supabase: Add Codespaces URL to allowed origins
   https://your-codespace-url.app.github.dev
   ```

3. **Environment Configuration:**
   ```bash
   # .env.local in Codespaces
   NEXTAUTH_URL="https://your-codespace-url.app.github.dev"
   NEXT_PUBLIC_BASE_URL="https://your-codespace-url.app.github.dev"
   ```

## 🌐 Vercel Production Setup

### 1. Environment Variables in Vercel Dashboard

Add these in your Vercel project settings:

```bash
# Database (Supabase Production)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-production-anon-key"

# Authentication
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-production-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Payments (Production Stripe)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Application URLs
NEXT_PUBLIC_BASE_URL="https://your-domain.vercel.app"
```

### 2. OAuth Configuration for Production

Update OAuth providers with production URLs:

```bash
# Google Console
Authorized JavaScript origins: https://your-domain.vercel.app
Authorized redirect URIs: https://your-domain.vercel.app/api/auth/callback/google

# Supabase Dashboard
Site URL: https://your-domain.vercel.app
Additional redirect URLs: https://your-domain.vercel.app/**
```

## 🔄 Environment Switching

Use the provided script to switch between environments:

```bash
# Switch to local development
./scripts/switch-db-env.sh local

# Switch to cloud/remote
./scripts/switch-db-env.sh remote
```

## 🔍 Troubleshooting

### Common Issues

1. **Build Errors (Missing DATABASE_URL)**

   ```bash
   # Solution: Add fallback in next.config.js
   env: {
     DATABASE_URL: process.env.DATABASE_URL || 'postgresql://fallback',
   }
   ```

2. **OAuth Redirect Mismatch**

   ```bash
   # Check NEXTAUTH_URL matches your actual domain
   # Verify OAuth provider settings
   ```

3. **Supabase Connection Issues**
   ```bash
   # Verify NEXT_PUBLIC_SUPABASE_URL format
   # Check anon key permissions
   ```

### Environment Validation Script

```bash
# Run environment validation
./scripts/verify-build.sh
```

## 📚 Related Documentation

- [VERCEL_DEPLOYMENT_CHECKLIST.md](../VERCEL_DEPLOYMENT_CHECKLIST.md) - Complete deployment guide
- [PRISMA_SUPABASE_INTEGRATION.md](../PRISMA_SUPABASE_INTEGRATION.md) - Database setup
- [AUTHENTICATION_FLOW.md](../AUTHENTICATION_FLOW.md) - Auth configuration

---

**Note**: Always use test/development keys in development and staging environments. Never commit sensitive environment variables to version control.
