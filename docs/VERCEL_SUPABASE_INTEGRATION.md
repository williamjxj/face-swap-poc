# Vercel-Supabase Integration Guide

This guide covers how to integrate Vercel deployment with Supabase using the current package.json dependencies.

## Current Stack

Based on `package.json`:
- **Next.js**: 15.2.4 with App Router
- **Supabase**: @supabase/supabase-js v2.49.8
- **Prisma**: 6.7.0 for database ORM
- **NextAuth**: 4.24.11 for authentication

## Integration Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Supabase      │    │   External APIs │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Next.js App │ │◄──►│ │ PostgreSQL  │ │    │ │ Modal.run   │ │
│ │             │ │    │ │ Database    │ │    │ │ Face Swap   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ API Routes  │ │◄──►│ │ Auth        │ │    │ │ Stripe      │ │
│ │ (Serverless)│ │    │ │ Storage     │ │    │ │ Payments    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Database Integration

### 1. Prisma Configuration

The project uses Prisma as the ORM layer between Next.js and Supabase PostgreSQL:

```javascript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 2. Connection Pooling Setup

**Environment Variables**:
```bash
# Connection pooling for application queries
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct connection for migrations
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

### 3. Prisma Client Optimization

```javascript
// src/lib/db.js
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

## Authentication Integration

### 1. NextAuth + Supabase Setup

The project uses NextAuth.js v4 with Supabase as the database adapter:

```javascript
// src/services/auth.js
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/db"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
  },
}
```

### 2. Database Schema for Auth

NextAuth requires specific tables in Supabase:

```sql
-- Users table (managed by Prisma)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  email_verified TIMESTAMPTZ,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts table (OAuth providers)
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, provider_account_id)
);
```

## Vercel Deployment Configuration

### 1. Environment Variables in Vercel

**Required Variables**:
```bash
# Database
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[anon-key]"

# NextAuth
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="[generate-new-for-production]"

# OAuth
GOOGLE_CLIENT_ID="[production-client-id]"
GOOGLE_CLIENT_SECRET="[production-client-secret]"
```

### 2. Vercel Configuration File

```json
// vercel.json
{
  "functions": {
    "src/app/api/**/*.js": {
      "maxDuration": 300,
      "memory": 1024
    }
  },
  "build": {
    "env": {
      "PRISMA_GENERATE_DATAPROXY": "true"
    }
  }
}
```

### 3. Build Configuration

```json
// package.json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

## API Routes Integration

### 1. Database Operations

```javascript
// src/app/api/users/route.js
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/services/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany()
    return Response.json({ data: users })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

### 2. File Storage Integration

```javascript
// src/app/api/upload/route.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Server-side operations
)

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    
    const { data, error } = await supabase.storage
      .from('media')
      .upload(`uploads/${Date.now()}-${file.name}`, file)
    
    if (error) throw error
    
    return Response.json({ data })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

## Performance Optimizations

### 1. Connection Management

```javascript
// Implement connection cleanup in API routes
export async function GET() {
  try {
    const result = await prisma.user.findMany()
    return Response.json({ data: result })
  } finally {
    // Prisma handles connection pooling automatically
    // No manual disconnect needed in serverless environment
  }
}
```

### 2. Caching Strategy

```javascript
// src/app/api/data/route.js
export async function GET() {
  const data = await prisma.user.findMany()
  
  return Response.json({ data }, {
    headers: {
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
    }
  })
}
```

## Monitoring and Debugging

### 1. Health Check Endpoint

```javascript
// src/app/api/health/route.js
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    
    return Response.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    })
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 500 })
  }
}
```

### 2. Error Handling

```javascript
// Global error handling pattern
export async function POST(request) {
  try {
    // Your logic here
  } catch (error) {
    console.error('API Error:', error)
    
    if (error.code === 'P2002') {
      return Response.json({ error: 'Duplicate entry' }, { status: 409 })
    }
    
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## Best Practices

### 1. Environment Management
- Use different Supabase projects for development/production
- Rotate secrets regularly
- Use connection pooling for production
- Monitor connection limits

### 2. Security
- Use Row Level Security (RLS) in Supabase
- Validate all inputs in API routes
- Use service role keys only server-side
- Implement rate limiting

### 3. Performance
- Use Prisma's connection pooling
- Implement proper caching headers
- Optimize database queries
- Monitor function execution times

---

**Last Updated**: January 2025
