# 🐙 GitHub Codespaces Development Guide

This guide covers development setup and best practices when using GitHub Codespaces for the Face Swap POC project.

## 🚀 Quick Start

### 1. Launch Codespace

1. **From GitHub Repository:**
   - Navigate to the repository
   - Click **Code** → **Codespaces** → **Create codespace on main**

2. **Automatic Setup:**
   - Environment is automatically configured
   - Dependencies are installed
   - Development server is ready to start

### 2. First-Time Setup

```bash
# 1. Copy environment template
cp .env.example .env.local

# 2. Start development server
npm run dev

# 3. Access the application
# Open the forwarded port 3000 in browser
```

## 🔧 Codespaces Configuration

### Environment Variables

Codespaces uses environment variables from two sources:

1. **Repository Secrets** (sensitive data)
2. **Public variables** (non-sensitive configuration)

#### Setting Up Secrets

Go to **Repository Settings** → **Secrets and variables** → **Codespaces**:

```bash
# Required Repository Secrets
NEXTAUTH_SECRET="your-nextauth-secret-min-32-chars"
GOOGLE_CLIENT_SECRET="your-google-oauth-secret"
AZURE_AD_CLIENT_SECRET="your-azure-secret"  # If using Azure
STRIPE_SECRET_KEY="sk_test_your_stripe_secret"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-key"
```

#### Public Variables

These can be set in the Codespaces interface or environment files:

```bash
# .env.local in Codespaces
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable"
GOOGLE_CLIENT_ID="your-google-client-id"
STRIPE_PRICE_ID="price_your_stripe_price_id"

# Codespaces URLs (auto-detected)
NEXTAUTH_URL="https://your-codespace-url.app.github.dev"
NEXT_PUBLIC_BASE_URL="https://your-codespace-url.app.github.dev"
```

### OAuth Configuration for Codespaces

#### Google OAuth Setup

1. **Google Cloud Console:**

   ```bash
   # Authorized JavaScript origins
   https://your-codespace-url.app.github.dev

   # Authorized redirect URIs
   https://your-codespace-url.app.github.dev/api/auth/callback/google
   ```

2. **Dynamic URL Handling:**
   Since Codespace URLs are dynamic, you may need to update OAuth settings each time.

#### Supabase Configuration

1. **Add Codespace URL to Supabase:**
   ```bash
   # In Supabase Dashboard → Authentication → URL Configuration
   Site URL: https://your-codespace-url.app.github.dev
   Additional redirect URLs: https://your-codespace-url.app.github.dev/**
   ```

## 🗂️ Development Workflow

### Daily Development Routine

```bash
# 1. Start/Resume Codespace
# Codespace automatically resumes your work

# 2. Update dependencies (if needed)
npm install

# 3. Generate Prisma client (if schema changed)
npx prisma generate

# 4. Start development server
npm run dev

# 5. Open application
# Use the ports tab to access localhost:3000
```

### Database Operations

```bash
# View database in Prisma Studio
npm run db:studio

# Apply schema changes
npm run db:push

# Run migrations
npm run db:migrate

# Switch between local/cloud database
./scripts/switch-db-env.sh
```

### Code Quality

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint-fix

# Format code
npm run format

# Check formatting
npm run check-format
```

## 🔌 Port Forwarding

Codespaces automatically forwards these ports:

| Port  | Service        | Access                       |
| ----- | -------------- | ---------------------------- |
| 3000  | Next.js App    | Public (web browser)         |
| 5555  | Prisma Studio  | Private (authenticated)      |
| 54321 | Local Supabase | Private (if running locally) |

### Accessing Your Application

1. **Ports Tab:** Click on the Ports tab in VS Code
2. **Open in Browser:** Click the globe icon next to port 3000
3. **Share:** Make port public to share with others

## 🛠️ Development Tools

### Available Scripts

```bash
# Development
npm run dev          # Start with Turbopack
npm run dev:cloud    # Use cloud Supabase
npm run dev:local    # Use local Supabase

# Building
npm run build        # Production build
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Run migrations

# Code Quality
npm run lint         # Check for issues
npm run lint-fix     # Fix issues automatically
npm run format       # Format code with Prettier

# Setup
npm run setup        # Install + generate
npm run setup:cloud  # Setup for cloud development
npm run setup:local  # Setup for local development
```

### VS Code Extensions

Pre-installed extensions in Codespaces:

- **ES7+ React/Redux/React-Native snippets**
- **Prettier - Code formatter**
- **ESLint**
- **Prisma**
- **Tailwind CSS IntelliSense**
- **Auto Rename Tag**
- **Bracket Pair Colorizer**

## 🔄 Database Development

### Local vs Cloud Database

#### Using Cloud Supabase (Recommended)

```bash
# Advantages:
- Consistent data across team
- No local setup required
- Production-like environment

# Setup:
./scripts/switch-db-env.sh remote
npm run dev:cloud
```

#### Using Local Supabase

```bash
# Advantages:
- Faster development
- Offline capabilities
- Local testing

# Setup:
supabase start
./scripts/switch-db-env.sh local
npm run dev:local
```

### Migration Workflow

```bash
# 1. Make schema changes in prisma/schema.prisma
# 2. Generate and apply migration
npx prisma migrate dev --name "describe_your_change"

# 3. Update production (when ready)
npx prisma migrate deploy
```

## 🚨 Troubleshooting

### Common Issues

1. **Port 3000 Already in Use**

   ```bash
   # Solution: Kill existing process
   pkill -f "next"
   npm run dev
   ```

2. **OAuth Redirect Mismatch**

   ```bash
   # Update OAuth providers with current Codespace URL
   # Check NEXTAUTH_URL in .env.local
   ```

3. **Database Connection Issues**

   ```bash
   # Check DATABASE_URL format
   # Verify Supabase project status
   # Run: npm run db:generate
   ```

4. **Build Errors**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   ```

### Performance Optimization

```bash
# Use Turbopack for faster builds
npm run dev  # Already includes --turbopack

# Minimize extensions and processes
# Close unnecessary tabs and terminals
```

## 🔐 Security Best Practices

### Environment Variables

```bash
# Never commit secrets to the repository
# Use .env.local for local development
# Verify .gitignore includes .env.local
```

### Codespace Access

```bash
# Keep Codespaces private unless explicitly sharing
# Don't share environment variables in chat/issues
# Regularly delete unused Codespaces
```

## 📚 Related Documentation

- [ci-cd-setup.md](./ci-cd-setup.md) - CI/CD configuration
- [environment-variables.md](./environment-variables.md) - Environment setup
- [../PROJECT_SETUP_GUIDE.md](../PROJECT_SETUP_GUIDE.md) - Initial project setup

---

**Note**: Codespaces provide a consistent development environment that mirrors production. This ensures code works the same way across all developers and deployment environments.
