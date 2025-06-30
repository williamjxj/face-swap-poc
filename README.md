# Face Swap POC

A Next.js application for AI-powered face swapping with multiple deployment options and cloud integrations.

## Table of Contents

1. [Quick Start Options](#quick-start-options)
2. [Detailed Setup Instructions](#detailed-setup-instructions)
3. [Project Structure](#project-structure)
4. [Application Workflow](#application-workflow)
5. [Authentication](#authentication)
6. [Third Party APIs](#third-party-apis)
7. [Production Deployment](#production-deployment)
8. [Notes & Tips](#notes--tips)

## Quick Start Options

Choose your preferred development setup:

### 🚀 Option 1: Local Next.js + Cloud Supabase (Recommended)

```bash
# 1. Clone and install
git clone <your-repo>
cd face-swap-poc
npm install

# 2. Setup environment
cp .env .env.local  # Use cloud Supabase config
# Edit .env with your Supabase cloud credentials

# 3. Setup database
npx prisma generate
npx prisma db push

# 4. Start development
npm run dev
```

**Best for**: Quick development with cloud database

### 🐳 Option 2: Local Next.js + Local Dockerized Supabase

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Clone and install
git clone <your-repo>
cd face-swap-poc
npm install

# 3. Start local Supabase
supabase start

# 4. Use local environment
# .env.local is already configured for local Supabase

# 5. Setup database
npx prisma generate
npx prisma db push

# 6. Start development
npm run dev
```

**Best for**: Offline development, testing migrations

### 💾 Option 3: Local Next.js + Local PostgreSQL

```bash
# 1. Install PostgreSQL locally
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql

# 2. Create database
createdb facefusion

# 3. Clone and install
git clone <your-repo>
cd face-swap-poc
npm install

# 4. Setup environment
cp .env .env.local  # Start with cloud config template
# Edit DATABASE_URL: postgresql://postgres:password@localhost:5432/facefusion

# 5. Setup database
npx prisma generate
npx prisma db push

# 6. Start development
npm run dev
```

**Best for**: Traditional PostgreSQL workflow

### ☁️ Option 4: Vercel + Cloud Supabase (Production)

```bash
# 1. Deploy to Vercel
vercel deploy

# 2. Set environment variables in Vercel dashboard:
# - Copy all variables from .env.production
# - Update NEXTAUTH_SECRET with new production secret

# 3. Database is ready (uses same Supabase instance)
```

**Best for**: Production deployment

## Detailed Setup Instructions

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Environment Files Overview

The project uses different environment files for different setups:

- **`.env`** - Cloud Supabase configuration (primary)
- **`.env.local`** - Local dockerized Supabase overrides
- **`.env.production`** - Production deployment reference

### Setup Option 1: Cloud Supabase (Recommended)

1. **Create Supabase Project**

   ```bash
   # Go to https://supabase.com
   # Create new project
   # Get URL and anon key from Settings > API
   ```

2. **Configure Environment**

   ```bash
   cp .env .env.local  # Start with cloud config template
   # Edit .env with your Supabase credentials:
   # NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   # NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   # DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
   ```

3. **Install and Setup**
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

### Setup Option 2: Local Dockerized Supabase

1. **Install Supabase CLI**

   ```bash
   npm install -g supabase
   ```

2. **Initialize and Start Supabase**

   ```bash
   supabase init  # If not already initialized
   supabase start
   ```

   This will start:

   - API URL: http://localhost:54321
   - DB URL: postgresql://postgres:postgres@localhost:54322/postgres
   - Studio: http://localhost:54323
   - Inbucket: http://localhost:54324

3. **Setup Application**
   ```bash
   npm install
   # .env.local is already configured for local Supabase
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

### Setup Option 3: Local PostgreSQL

1. **Install PostgreSQL**

   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql

   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql

   # Create database
   createdb facefusion
   ```

2. **Configure Environment**

   ```bash
   cp .env .env.local  # Start with cloud config template
   # Edit DATABASE_URL in .env:
   # DATABASE_URL=postgresql://postgres:your-password@localhost:5432/facefusion
   ```

3. **Setup Application**
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

### OAuth Configuration

For all setups, configure OAuth providers:

1. **Google OAuth**

   - Go to [Google Cloud Console](https://console.developers.google.com/)
   - Create OAuth 2.0 credentials
   - Add redirect URIs: `http://localhost:3000/api/auth/callback/google`

2. **Microsoft Azure AD**
   - Go to [Azure Portal](https://portal.azure.com/)
   - Register new application
   - Add redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`

### Payment Configuration

Configure payment providers in your `.env`:

```env
# Stripe (get from https://dashboard.stripe.com/)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# PayPal (get from https://developer.paypal.com/)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open <http://localhost:3000> in your browser.

## Production Deployment

### Vercel Deployment (Recommended)

1. **Prepare for Production**

   ```bash
   # Ensure your code is committed
   git add .
   git commit -m "Ready for production"
   git push origin main
   ```

2. **Deploy to Vercel**

   ```bash
   # Install Vercel CLI (if not installed)
   npm install -g vercel

   # Deploy
   vercel
   # Follow prompts to link project
   ```

3. **Configure Environment Variables**

   In Vercel Dashboard → Settings → Environment Variables, add:

   ```env
   NODE_ENV=production
   NEXT_PUBLIC_BASE_URL=https://face-swap-poc.vercel.app
   NEXTAUTH_URL=https://face-swap-poc.vercel.app
   NEXTAUTH_SECRET=<generate-new-secret>

   # Supabase (same as development)
   NEXT_PUBLIC_SUPABASE_URL=https://yunxidsqumhfushjcgyg.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   DATABASE_URL=<your-supabase-connection-string>

   # OAuth providers (update redirect URIs)
   GOOGLE_CLIENT_ID=<your-client-id>
   GOOGLE_CLIENT_SECRET=<your-client-secret>

   # Payment providers (upgrade to live keys)
   STRIPE_SECRET_KEY=<live-secret-key>
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<live-publishable-key>
   ```

4. **Update OAuth Redirect URIs**

   - **Google**: Add `https://face-swap-poc.vercel.app/api/auth/callback/google`
   - **Azure**: Add `https://face-swap-poc.vercel.app/api/auth/callback/azure-ad`

5. **Database Migration** (if needed)
   ```bash
   # Run migrations against production database
   npx prisma db push
   ```

### Alternative: Linux Server Deployment

#### 1. Install Node.js (CentOS/RHEL)

```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

#### 2. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

#### 3. Build and Run

```bash
git clone <your-repo>
cd face-swap-poc
npm install
npm run build
pm2 start "npm run start" --name face-swap-app
```

#### 4. Configure Nginx (Optional)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        send_timeout 300s;
    }
}
```

## Linux (CentOS) Deployment

### 1. Install Node.js

```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### 2. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 3. Build and Run

```bash
npm install
npm run build
pm2 start "npm run start" --name face-swap-app
```

### 4. Configure Nginx (Optional)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        send_timeout 300s;
    }
}
```

## Project Structure

- **Framework**: Next.js 15 with React 19
- **Routing**: App router architecture
- **Components**: Server components by default
- **Styling**: TailwindCSS with PostCSS
- **State Management**: React context and hooks
- **Authentication**: NextAuth.js with JWT sessions

## Application Workflow

1. **Authentication**

   - User signs in via Google or Microsoft
   - JWT session established
   - Session persisted via cookies

2. **FaceFusion Video Generation**

   - User provides prompt and style
   - Request sent to image generation API
   - Generated image URL returned

3. **Checkout Process**
   - User selects image for purchase
   - Checkout session created
   - Redirect to payment processor

## Authentication

The application uses NextAuth.js with the following providers:

- Google OAuth
- Microsoft Azure AD

### Session Management

- JWT strategy for sessions
- Custom sign-in page at `/auth/signin`
- Session utilities:
  - `loginWithGoogle()`
  - `loginWithMicrosoft()`
  - `getCurrentSession()`
  - `logout()`
  - `isAuthenticated()`

## Third Party APIs

### Payment Processing API

- Endpoint: `NEXT_PUBLIC_CHECKOUT_API_URL`
- Required parameters:
  - `imageId`: ID of image to purchase
  - `imageUrl`: URL of image to purchase
- Returns:
  - `checkoutUrl`: Payment processor URL

## Notes & Tips

### Environment Management

- **`.env`**: Primary configuration for cloud Supabase development
- **`.env.local`**: Overrides for local dockerized Supabase (takes precedence)
- **`.env.production`**: Reference for production environment variables
- Never commit `.env*` files to version control (already in `.gitignore`)

#### Environment Variable Priority

1. `.env.local` (highest priority, overrides everything)
2. `.env` (primary configuration)
3. System environment variables

#### Security Best Practices

1. **Never commit secrets**: Add `.env*` to `.gitignore` (already configured)
2. **Use different secrets per environment**: Generate new secrets for production
3. **Rotate secrets regularly**: Update API keys and secrets periodically
4. **Prefix public variables**: Only use `NEXT_PUBLIC_` for client-side variables

### Available Scripts

#### Development

- `npm run dev` - Start development server with Turbopack
- `npm run dev:cloud` - Start with cloud Supabase (default)
- `npm run dev:local` - Start local Supabase and development server

#### Database

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:migrate` - Run database migrations

#### Supabase (Local)

- `npm run supabase:start` - Start local Supabase
- `npm run supabase:stop` - Stop local Supabase
- `npm run supabase:status` - Check Supabase status
- `npm run supabase:reset` - Reset local database

#### Setup

- `npm run setup` - Install dependencies and generate Prisma client
- `npm run setup:cloud` - Setup for cloud Supabase development
- `npm run setup:local` - Setup for local Supabase development

### Quick Commands

```bash
# Development with cloud Supabase (default)
npm run dev

# Development with local Supabase
supabase start && npm run dev

# Database operations
npx prisma generate    # Generate Prisma client
npx prisma db push     # Push schema to database
npx prisma studio      # Open database GUI

# Local Supabase management
supabase start         # Start local Supabase stack
supabase stop          # Stop local Supabase
supabase status        # Check services status
supabase db reset      # Reset local database
```

### Switching Between Environments

1. **Cloud to Local Supabase**:

   ```bash
   supabase start
   # .env.local automatically overrides cloud settings
   npm run dev
   ```

2. **Local to Cloud Supabase**:
   ```bash
   supabase stop
   # Remove or rename .env.local to use .env settings
   mv .env.local .env.local.backup
   npm run dev
   ```

### Customization

- Add more auth providers by editing `src/services/auth.js`
- Modify session callback behavior in auth options
- Update MCP configuration in `.vscode/mcp.json` for AI integrations

### API Integration

- Standardize API responses with:
  - Success: `{ data }`
  - Error: `{ error }` with status code

### Development Best Practices

- Use `npm run lint` to check code quality
- Enable Turbopack for faster dev server: `npm run dev --turbopack`
- Use Prisma Studio for database management: `npx prisma studio`
- Test payment flows with Stripe test cards
- Monitor API usage in Modal dashboard

### Troubleshooting

**Database Connection Issues**:

- Check `DATABASE_URL` in your environment file
- Ensure Supabase project is active (for cloud)
- Verify local Supabase is running: `supabase status`
- **Cloud Supabase**: Check your `DATABASE_URL` and Supabase credentials in `.env`
- **Local Supabase**: Run `npm run supabase:status` to check if services are running

**Authentication Issues**:

- Verify OAuth redirect URIs match your domain
- Check `NEXTAUTH_SECRET` is set and valid
- Ensure `NEXTAUTH_URL` matches your current domain
- Verify OAuth provider credentials and redirect URIs

**Payment Issues**:

- Verify Stripe webhook endpoints
- Check API keys are for correct environment (test vs live)
- Monitor Stripe dashboard for failed payments
- Verify Stripe/PayPal credentials
- Check webhook endpoints are configured correctly

**API Issues**:

- **Face fusion API errors**: Verify Modal API endpoints are accessible
- Check API keys and rate limits

**Build Issues**:

- Clear Next.js cache: `rm -rf .next`
- Regenerate Prisma client: `npx prisma generate`
- Check for TypeScript errors: `npm run type-check`

| nextjs app              | authentication lib             |
| ----------------------- | ------------------------------ |
| nextjs-supabase-gallery | @auth/supabase-adapter: v1.9.1 |
| nextjs-dashboard        | next-auth: 5.0                 |
| fact-swap-poc           | next-auth: 4.24.11             |
| nextjs-mcp-template     | next-auth: 5.0                 |
| manus-ai-shop           | @supabase/ssr: 0.5.2           |
