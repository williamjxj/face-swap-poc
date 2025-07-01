import { PrismaClient } from '@prisma/client'

// Create a global object for Prisma to prevent multiple instances
const globalForPrisma = globalThis

// Database configuration based on environment
const getDatabaseConfig = () => {
  const config = {
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }

  // Get database URL with fallback for build time
  let databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    // During build time, provide a fallback URL to prevent build failures
    if (process.env.NODE_ENV !== 'production') {
      console.warn('DATABASE_URL not found, using fallback for build process')
    }
    databaseUrl = 'postgresql://user:William1!@localhost:5432/fallback_db'
  }

  // For production, ensure we're using connection pooling
  if (process.env.NODE_ENV === 'production' && databaseUrl.includes('supabase.co')) {
    // If using direct connection, switch to pooler
    if (databaseUrl.includes('db.yunxidsqumhfushjcgyg.supabase.co:5432')) {
      console.log('Switching to connection pooler for production')
      databaseUrl = databaseUrl.replace(
        'db.yunxidsqumhfushjcgyg.supabase.co:5432',
        'aws-0-us-west-1.pooler.supabase.com:6543'
      )
      // Add pooling parameters if not present
      if (!databaseUrl.includes('pgbouncer=true')) {
        databaseUrl += databaseUrl.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true'
      }
    }
  }

  config.datasources = {
    db: {
      url: databaseUrl,
    },
  }

  // Configure for serverless environments
  if (process.env.NODE_ENV === 'production') {
    config.errorFormat = 'minimal'
    // Optimize for serverless cold starts
    config.transactionOptions = {
      maxWait: 5000, // 5 seconds
      timeout: 10000, // 10 seconds
    }
  }

  return config
}

// Initialize PrismaClient with environment-specific configuration
export const db = globalForPrisma.prisma || new PrismaClient(getDatabaseConfig())

// Set the global prisma instance in development to prevent hot reload issues
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await db.$disconnect()
})

export default db
