import { PrismaClient } from '@prisma/client'

// Create a global object for Prisma to prevent multiple instances
const globalForPrisma = global || globalThis

// Database configuration based on environment
const getDatabaseConfig = () => {
  const config = {
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }

  // Add connection pooling for production (Supabase)
  if (process.env.NODE_ENV === 'production') {
    config.datasources = {
      db: {
        url: process.env.DATABASE_URL,
      },
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
