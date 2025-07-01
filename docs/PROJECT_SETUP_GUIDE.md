# Face Swap POC - Complete Setup Guide

## 🚀 Quick Start

This is a comprehensive setup guide for the Face Swap POC application built with Next.js, Prisma, Supabase, and Next-Auth v4.

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL (for local development) OR Supabase account
- Google Cloud Console account (for OAuth)
- Git

## 📖 Documentation Index

| Document                                                                | Purpose                                        |
| ----------------------------------------------------------------------- | ---------------------------------------------- |
| [🔧 PRISMA_SUPABASE_INTEGRATION.md](./PRISMA_SUPABASE_INTEGRATION.md)   | Database switching, migration, and integration |
| [🔐 AUTHENTICATION_FLOW.md](./AUTHENTICATION_FLOW.md)                   | Next-Auth v4 setup and authentication flow     |
| [☁️ VERCEL_DEPLOYMENT_CHECKLIST.md](./VERCEL_DEPLOYMENT_CHECKLIST.md)   | Production deployment checklist                |
| [⚙️ DEPLOYMENT_ENVIRONMENT_GUIDE.md](./DEPLOYMENT_ENVIRONMENT_GUIDE.md) | Environment variables and configuration        |
| [📝 CODE_CLEANUP_SUMMARY.md](./CODE_CLEANUP_SUMMARY.md)                 | Code improvements and refactoring              |
| [🔍 ESLINT_FIXES.md](./ESLINT_FIXES.md)                                 | Linting configuration and fixes                |

## 🛠️ Setup Options

### Option 1: Local Development with Local PostgreSQL

```bash
# 1. Clone and install
git clone <repository-url>
cd face-swap-poc
npm install

# 2. Setup local PostgreSQL
createdb facefusion

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with local PostgreSQL connection

# 4. Setup database
npm run db:generate
npm run db:push

# 5. Start development
npm run dev
```

### Option 2: Local Development with Supabase

```bash
# 1. Clone and install
git clone <repository-url>
cd face-swap-poc
npm install

# 2. Setup Supabase project at supabase.com
# Get your PROJECT_URL and ANON_KEY

# 3. Switch to Supabase configuration
./scripts/switch-db-env.sh supabase

# 4. Migrate schema to Supabase
./scripts/migrate-to-supabase.sh

# 5. Start development
npm run dev
```

### Option 3: Production Deployment on Vercel

Follow the [Vercel Deployment Checklist](./VERCEL_DEPLOYMENT_CHECKLIST.md) for step-by-step production deployment.

## 🔄 Switching Between Environments

Use the interactive script to switch between local and remote databases:

```bash
./scripts/switch-db-env.sh
```

Options:

- `local` - Switch to local PostgreSQL
- `supabase` - Switch to Supabase
- `reset` - Reset to example configuration

## 📊 Database Management

### Prisma Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes (development)
npm run db:push

# Create and apply migrations (production)
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

### Migration Scripts

```bash
# Migrate from local to Supabase
./scripts/migrate-to-supabase.sh

# Verify build and environment
./scripts/verify-build.sh
```

## 🔐 Authentication Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-app.vercel.app/api/auth/callback/google`
4. Add credentials to environment variables

### Next-Auth Configuration

The app uses Next-Auth v4 with:

- Google OAuth provider
- Azure AD provider (optional)
- Credentials provider for email/password
- Prisma adapter for database sessions

See [AUTHENTICATION_FLOW.md](./AUTHENTICATION_FLOW.md) for detailed configuration.

## 🌍 Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Next-Auth
NEXTAUTH_URL="http://localhost:3000"  # or production URL
NEXTAUTH_SECRET="generate-secure-secret"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL="https://project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### Environment Files

- `.env.local` - Local development (not committed)
- `.env.production` - Production overrides (not committed)
- `.env.example` - Template with example values (committed)

## 🧪 Testing and Verification

### Build Verification

```bash
# Verify clean build
npm run build

# Check for linting issues
npm run lint

# Verify environment setup
./scripts/verify-build.sh
```

### Database Testing

```bash
# Test local database connection
npm run db:studio

# Test Prisma client
node -e "const { db } = require('./src/lib/db.js'); db.user.findMany().then(console.log)"
```

## 🚨 Troubleshooting

### Common Issues

1. **Build fails with "Can't reach database server"**
   - Ensure DATABASE_URL is set in build environment
   - Check `next.config.js` fallback configuration

2. **Authentication not working**
   - Verify OAuth redirect URIs match your domain
   - Check NEXTAUTH_URL and NEXTAUTH_SECRET
   - Ensure database schema includes NextAuth tables

3. **Prisma client errors**
   - Run `npm run db:generate` after schema changes
   - Ensure database is accessible and schema is up to date

4. **Environment variables not loading**
   - Check file naming (`.env.local` not `.env.local.`)
   - Verify variables don't have trailing spaces
   - Restart development server after changes

### Debug Tools

```bash
# Check environment variables
node -e "console.log(process.env.DATABASE_URL)"

# Test database connection
npm run db:studio

# Verify Prisma schema
npx prisma validate

# Check Next.js build
npm run build 2>&1 | grep -i error
```

## 📋 Development Workflow

### Daily Development

1. Start with environment verification:

   ```bash
   ./scripts/verify-build.sh
   ```

2. Start development server:

   ```bash
   npm run dev
   ```

3. Make changes and test locally

4. Before committing:
   ```bash
   npm run lint
   npm run build
   ```

### Switching Database Contexts

When switching between local and Supabase:

1. Use the switch script:

   ```bash
   ./scripts/switch-db-env.sh supabase
   ```

2. Generate Prisma client:

   ```bash
   npm run db:generate
   ```

3. Test the connection:
   ```bash
   npm run db:studio
   ```

### Deploying to Production

1. Follow [VERCEL_DEPLOYMENT_CHECKLIST.md](./VERCEL_DEPLOYMENT_CHECKLIST.md)
2. Set all required environment variables in Vercel dashboard
3. Deploy and verify all functionality

## 🤝 Contributing

1. Read through the documentation in `/docs`
2. Ensure clean build: `npm run build && npm run lint`
3. Test with both local and Supabase databases
4. Update documentation if adding new features

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next-Auth Documentation](https://next-auth.js.org/getting-started/introduction)
- [Vercel Deployment](https://vercel.com/docs)

---

**Need Help?** Check the troubleshooting section above or refer to the specific documentation files for detailed guidance.
