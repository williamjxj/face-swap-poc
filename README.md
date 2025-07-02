# Face Swap POC

A Next.js application for AI-powered face swapping with Supabase database and Vercel deployment.

## Quick Start

Choose your preferred development setup:

### 🚀 Cloud Development (Recommended)

```bash
# 1. Clone and install
git clone <your-repo>
cd face-swap-poc
npm install

# 2. Setup environment
cp .env.example .env
# Fill in your Supabase and OAuth credentials

# 3. Setup database
npm run db:push

# 4. Start development
npm run dev
```

### 🔧 Local Development

```bash
# 1. Start local Supabase
npm run setup:local

# 2. Start development
npm run dev:local
```

## Environment Setup

### Required Environment Variables

```bash
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[anon-key]"

# Authentication
NEXTAUTH_URL="http://localhost:3000"  # or your production URL
NEXTAUTH_SECRET="[generate-with-openssl-rand-base64-32]"
GOOGLE_CLIENT_ID="[google-oauth-client-id]"
GOOGLE_CLIENT_SECRET="[google-oauth-client-secret]"
```

## Production Deployment

### Vercel Deployment

1. **Connect GitHub repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Update OAuth redirect URIs for production domain**
4. **Deploy**

See [docs/VERCEL_DEPLOYMENT_CHECKLIST.md](docs/VERCEL_DEPLOYMENT_CHECKLIST.md) for detailed instructions.

## Documentation

For detailed setup, deployment, and troubleshooting guides, see the [docs/](docs/) directory:

- **[Setup Guide](docs/PROJECT_SETUP_GUIDE.md)** - Complete project setup
- **[Deployment Guide](docs/VERCEL_DEPLOYMENT_CHECKLIST.md)** - Vercel deployment
- **[Authentication](docs/AUTHENTICATION_FLOW.md)** - NextAuth configuration
- **[Troubleshooting](docs/troubleshooting/)** - Common issues and solutions

## Tech Stack

- **Framework**: Next.js 15 with React 19
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Deployment**: Vercel + Supabase
- **Styling**: TailwindCSS

## Features

- **Face Swapping**: AI-powered face swapping using external APIs
- **Authentication**: Google OAuth and credential-based login
- **Media Management**: Upload, process, and download face-swapped content
- **Payment Integration**: Stripe integration for premium features
- **Real-time Processing**: Progress tracking for face swap operations

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema
- `npm run db:studio` - Open Prisma Studio

## Troubleshooting

For common issues and deployment problems, see:

- [Common Issues](docs/troubleshooting/common-issues.md)
- [Deployment Issues](docs/troubleshooting/deployment-issues.md)
- [Vercel Deployment Guide](docs/VERCEL_DEPLOYMENT_CHECKLIST.md)

---

**Last Updated**: January 2025
