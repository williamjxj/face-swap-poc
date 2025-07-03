import { db } from '@/lib/db'

export default async function handler(req, res) {
  try {
    // Test basic database connection
    console.log('Testing database connection...')
    const dbTest = await db.$queryRaw`SELECT 1 as test, NOW() as current_time`
    console.log('Database test result:', dbTest)

    // Test user table access
    const userCount = await db.user.count()
    console.log('User count:', userCount)

    // Get first few users (without sensitive data)
    const users = await db.user.findMany({
      take: 3,
      select: {
        id: true,
        account: true,
        name: true,
        createdAt: true,
        email: true,
      },
    })
    console.log('Sample users:', users)

    return res.status(200).json({
      success: true,
      database: {
        connected: true,
        userCount,
        sampleUsers: users,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Database test error:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
      details: 'Database connection failed',
    })
  }
}
