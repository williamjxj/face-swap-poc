import { PrismaClient } from '@prisma/client'

// Create a global object for Prisma to prevent multiple instances
const globalForPrisma = global || globalThis

// Database configuration based on environment
const getDatabaseConfig = () => {
  const config = {
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }

  // Ensure DATABASE_URL is available for all environments
  if (!process.env.DATABASE_URL) {
    // During build time, provide a fallback URL to prevent build failures
    if (process.env.NODE_ENV !== 'production') {
      console.warn('DATABASE_URL not found, using fallback for build process')
    }
    config.datasources = {
      db: {
        url: 'postgresql://user:William1!@localhost:5432/fallback_db',
      },
    }
  } else {
    config.datasources = {
      db: {
        url: process.env.DATABASE_URL,
      },
    }
  }

  // Add connection pooling configuration for production
  if (process.env.NODE_ENV === 'production') {
    config.connectionLimit = 1
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
