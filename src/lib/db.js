import { PrismaClient } from '@prisma/client'

// Create a global object for Prisma to prevent multiple instances
const globalForPrisma = global || globalThis

// Initialize PrismaClient
export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
  })

// Set the global prisma instance in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

export default db
