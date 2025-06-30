# Prisma + Supabase + Next-Auth v4 Integration Guide

## Overview

This guide covers integrating Prisma, Supabase, and Next-Auth v4 in three deployment scenarios:
1. **Local App + Local PostgreSQL** ✅ (Working)
2. **Local App + Remote Supabase DB** 🔧 (Target)
3. **Vercel App + Remote Supabase DB** 🔧 (Target)

## Architecture Overview

```mermaid
graph TB
    subgraph "Next.js App"
        A[Next-Auth v4] --> B[Prisma Client]
        B --> C[Database Layer]
        D[API Routes] --> B
        E[Auth Middleware] --> A
    end
    
    subgraph "Authentication Providers"
        F[Google OAuth]
        G[Azure AD]
        H[Credentials]
    end
    
    subgraph "Database Options"
        I[Local PostgreSQL]
        J[Supabase PostgreSQL]
    end
    
    subgraph "Deployment"
        K[Local Development]
        L[Vercel Production]
    end
    
    A --> F
    A --> G
    A --> H
    C --> I
    C --> J
    K --> I
    K --> J
    L --> J
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style J fill:#e8f5e8
```

## Scenario Configurations

### 1. Local App + Local PostgreSQL ✅
```bash
# .env.local
DATABASE_URL="postgresql://postgres:password@localhost:5432/facefusion"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Local App + Remote Supabase DB 🎯
```bash
# .env.local  
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON-KEY]"
```

### 3. Vercel App + Remote Supabase DB 🎯
```bash
# Vercel Environment Variables
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="[PRODUCTION-SECRET]"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON-KEY]"
```

## Database Migration Strategy

### Step 1: Export Local Schema
```bash
# Export your local database structure
pg_dump -h localhost -U postgres -d facefusion --schema-only > schema.sql

# Export data (optional)
pg_dump -h localhost -U postgres -d facefusion --data-only > data.sql
```

### Step 2: Prepare Supabase Database
```bash
# Reset Supabase migrations (if needed)
npx supabase db reset

# Apply Prisma schema to Supabase
npx prisma db push --accept-data-loss
```

### Step 3: Verify Migration
```bash
# Generate fresh Prisma client
npx prisma generate

# Check database status
npx prisma db pull
```

## How Components Work Together

### Prisma + Supabase Integration

**Prisma Role:**
- ORM layer for type-safe database operations
- Schema management and migrations
- Query optimization and connection pooling

**Supabase Role:**
- Managed PostgreSQL database hosting
- Real-time subscriptions (if needed)
- Built-in Row Level Security (RLS)
- Database backups and scaling

**Integration Flow:**
```javascript
// src/lib/db.js
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global || globalThis

const getDatabaseConfig = () => ({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Points to Supabase
    }
  }
})

export const db = globalForPrisma.prisma || new PrismaClient(getDatabaseConfig())
```

### Next-Auth v4 + Prisma + Supabase

**Authentication Flow:**
1. User authenticates via Next-Auth providers
2. Next-Auth stores session data in database via Prisma
3. Prisma connects to Supabase PostgreSQL
4. User sessions persist across requests

**Configuration:**
```javascript
// src/services/auth.js
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // ... other providers
  ],
  adapter: PrismaAdapter(db), // Connects to Supabase via Prisma
  session: {
    strategy: 'jwt', // Recommended for Vercel deployment
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
}
```

## Environment Switching Guide

### Quick Switch Script
Create `scripts/switch-db.sh`:

```bash
#!/bin/bash

echo "Database Environment Switcher"
echo "1) Local PostgreSQL"
echo "2) Remote Supabase"
read -p "Choose option (1-2): " choice

case $choice in
  1)
    echo "Switching to Local PostgreSQL..."
    cp .env.local.template .env.local
    sed -i '' 's/SUPABASE_DATABASE_URL/# SUPABASE_DATABASE_URL/' .env.local
    sed -i '' 's/# LOCAL_DATABASE_URL/LOCAL_DATABASE_URL/' .env.local
    echo "✅ Switched to Local PostgreSQL"
    ;;
  2)
    echo "Switching to Remote Supabase..."
    cp .env.local.template .env.local
    sed -i '' 's/LOCAL_DATABASE_URL/# LOCAL_DATABASE_URL/' .env.local
    sed -i '' 's/# SUPABASE_DATABASE_URL/SUPABASE_DATABASE_URL/' .env.local
    echo "✅ Switched to Remote Supabase"
    ;;
  *)
    echo "Invalid option"
    ;;
esac

echo "Run: npm run db:generate && npm run dev"
```

### Environment Template
Create `.env.local.template`:

```bash
# Database Configuration - Choose ONE
# LOCAL_DATABASE_URL="postgresql://postgres:password@localhost:5432/facefusion"
SUPABASE_DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"

# Set active database
DATABASE_URL=${SUPABASE_DATABASE_URL}

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE-ROLE-KEY]"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-local-secret"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Key Migration Points

### 1. Database URL Format
```bash
# Local PostgreSQL
postgresql://user:password@localhost:5432/database

# Supabase PostgreSQL  
postgresql://postgres:password@db.project-id.supabase.co:5432/postgres
```

### 2. Connection Pooling
```javascript
// For production Supabase, enable connection pooling
const DATABASE_URL = process.env.DATABASE_URL
const pooledUrl = DATABASE_URL?.includes('supabase.co') 
  ? DATABASE_URL.replace(':5432/', ':6543/') + '?pgbouncer=true'
  : DATABASE_URL
```

### 3. Schema Synchronization
```bash
# Pull current schema from Supabase
npx prisma db pull

# Push local schema to Supabase  
npx prisma db push

# Generate client after schema changes
npx prisma generate
```

### 4. Data Migration
```bash
# Export from local
pg_dump postgresql://postgres:password@localhost:5432/facefusion > backup.sql

# Import to Supabase (via psql)
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres" < backup.sql
```

## Vercel Deployment Keys

### Required Environment Variables in Vercel:

```bash
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="[SECURE-PRODUCTION-SECRET]"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE-ROLE-KEY]"

# OAuth Providers
GOOGLE_CLIENT_ID="[PRODUCTION-GOOGLE-CLIENT-ID]"
GOOGLE_CLIENT_SECRET="[PRODUCTION-GOOGLE-CLIENT-SECRET]"
AZURE_AD_CLIENT_ID="[PRODUCTION-AZURE-CLIENT-ID]"
AZURE_AD_CLIENT_SECRET="[PRODUCTION-AZURE-CLIENT-SECRET]"
AZURE_AD_TENANT_ID="[AZURE-TENANT-ID]"

# Application URLs
NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

### Deployment Checklist:
- [ ] Set up Supabase project and get credentials
- [ ] Configure OAuth providers for production URLs
- [ ] Set all environment variables in Vercel dashboard
- [ ] Run `prisma db push` to sync schema
- [ ] Test authentication with production URLs
- [ ] Verify database connections in production

## Troubleshooting Common Issues

### Issue 1: Connection Refused
```bash
# Check if DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
npx prisma db pull
```

### Issue 2: OAuth Redirect Mismatch
```bash
# Ensure OAuth providers have correct redirect URLs:
# Local: http://localhost:3000/api/auth/callback/[provider]
# Prod: https://your-app.vercel.app/api/auth/callback/[provider]
```

### Issue 3: Schema Drift
```bash
# Reset and resync
npx prisma migrate reset
npx prisma db push
npx prisma generate
```

This comprehensive guide should help you successfully migrate from local PostgreSQL to remote Supabase while maintaining proper authentication flow!
