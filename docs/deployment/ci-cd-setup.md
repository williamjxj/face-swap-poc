# 🔄 CI/CD Setup and Configuration

This guide covers setting up Continuous Integration and Continuous Deployment (CI/CD) for the Face Swap POC using GitHub Actions and Vercel.

## 🏗️ Overview

Our CI/CD pipeline supports:

- **GitHub Codespaces** for development
- **Automatic Vercel deployments** from GitHub
- **Database migrations** and environment management
- **Build verification** and testing

## 🚀 GitHub Codespaces Setup

### 1. Codespaces Configuration

The project is configured for GitHub Codespaces with automatic environment setup.

#### Benefits for Development:

- **Consistent environment** across all developers
- **Pre-configured** with all dependencies
- **Automatic** database and service startup
- **Remote development** from anywhere

#### Getting Started:

1. **Open in Codespaces:**

   ```bash
   # From GitHub repository
   Code → Codespaces → Create codespace on main
   ```

2. **Automatic Setup:**

   - Node.js and dependencies installed
   - Supabase CLI configured
   - Environment variables loaded from secrets
   - Database ready for development

3. **Development Commands:**

   ```bash
   # Start development server
   npm run dev

   # Run with local Supabase
   npm run dev:local

   # Run with cloud Supabase
   npm run dev:cloud
   ```

### 2. Codespaces Environment Variables

Configure in GitHub Repository → Settings → Secrets and variables → Codespaces:

```bash
# Required Secrets
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_SECRET="your-google-secret"
STRIPE_SECRET_KEY="sk_test_..."
SUPABASE_SERVICE_ROLE_KEY="your-service-key"

# Public Variables (can be set in devcontainer.json)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

## 🚢 Vercel Deployment Pipeline

### 1. Automatic Deployments

Vercel automatically deploys when:

- **Main branch** is updated (production)
- **Pull requests** are created (preview deployments)
- **Manual triggers** from Vercel dashboard

### 2. Build Configuration

Vercel uses these configurations:

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret"
  }
}
```

### 3. Deployment Hooks

#### Pre-deployment:

1. **Environment validation**
2. **Database connection check**
3. **Prisma client generation**

#### Post-deployment:

1. **Health checks**
2. **Database migrations** (if needed)
3. **Cache warming**

## 🔧 GitHub Actions Workflow

### 1. Build and Test Workflow

Create `.github/workflows/build-and-test.yml`:

```yaml
name: Build and Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup environment
        run: |
          cp .env.example .env
          echo "DATABASE_URL=postgresql://test:test@localhost:5432/test" >> .env

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Run linting
        run: npm run lint

      - name: Run build
        run: npm run build

      - name: Run tests
        run: npm test
```

### 2. Database Migration Workflow

Create `.github/workflows/migrate.yml`:

```yaml
name: Database Migration

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  migrate:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          npx prisma migrate deploy
          npx prisma generate
```

## 🔄 Environment-Specific Workflows

### Development Environment (Codespaces)

```bash
# Automatic setup on Codespaces start
npm install
npx prisma generate
supabase start  # If using local Supabase
npm run dev
```

### Staging Environment

```bash
# Manual deployment to staging
vercel --prod --scope=staging
npx prisma migrate deploy
```

### Production Environment

```bash
# Automatic deployment on main branch push
# Vercel handles build and deployment
# Post-deployment hook runs migrations
```

## 📊 Monitoring and Health Checks

### 1. Build Status Monitoring

Monitor through:

- **GitHub Actions** status badges
- **Vercel deployment** logs
- **Supabase** dashboard metrics

### 2. Health Check Endpoints

```javascript
// pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: 'connected', // Add actual DB check
  })
}
```

### 3. Deployment Verification

```bash
# Post-deployment verification script
curl -f https://your-app.vercel.app/api/health
```

## 🔐 Security Considerations

### 1. Secrets Management

- **Never commit** secrets to repository
- Use **GitHub Secrets** for CI/CD
- Use **Vercel Environment Variables** for deployments
- **Rotate secrets** regularly

### 2. Access Control

```bash
# Repository Settings
- Require PR reviews for main branch
- Require status checks to pass
- Restrict push to main branch
- Enable automated security updates
```

### 3. Environment Isolation

- **Separate** Supabase projects for staging/production
- **Different** OAuth credentials per environment
- **Isolated** Stripe accounts for test/live

## 🚨 Troubleshooting CI/CD Issues

### Common Build Failures

1. **Missing Environment Variables**

   ```bash
   # Solution: Check Vercel environment variables
   # Verify GitHub Secrets configuration
   ```

2. **Database Connection Issues**

   ```bash
   # Solution: Verify DATABASE_URL format
   # Check Supabase project status
   ```

3. **OAuth Configuration Errors**
   ```bash
   # Solution: Update OAuth redirect URLs
   # Verify NEXTAUTH_URL matches deployment URL
   ```

### Deployment Rollback

```bash
# Vercel rollback to previous deployment
vercel rollback [deployment-url]

# GitHub revert commit
git revert <commit-hash>
git push origin main
```

## 📚 Related Documentation

- [environment-variables.md](./environment-variables.md) - Environment configuration
- [vercel-setup.md](./vercel-setup.md) - Vercel deployment guide
- [../VERCEL_DEPLOYMENT_CHECKLIST.md](../VERCEL_DEPLOYMENT_CHECKLIST.md) - Deployment checklist

---

**Note**: This CI/CD setup prioritizes simplicity and reliability. Advanced features like automated testing, security scanning, and performance monitoring can be added as the project grows.
