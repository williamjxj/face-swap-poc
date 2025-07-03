import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export default async function handler(req, res) {
  // Handle GET requests for quick testing
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Debug Auth Endpoint Ready',
      usage: 'Send POST request with { email, password } in body',
      testUrl: '/debug-auth.html'
    })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body

    console.log('Debug Auth - Input:', {
      email: email ? 'provided' : 'missing',
      password: password ? 'provided' : 'missing',
    })

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    // Test database connection
    console.log('Debug Auth - Testing DB connection...')
    const dbTest = await db.$queryRaw`SELECT 1 as test`
    console.log('Debug Auth - DB connection successful:', dbTest)

    // Find user in database
    console.log('Debug Auth - Looking for user with account:', email)
    const user = await db.user.findUnique({
      where: { account: email },
    })

    console.log(
      'Debug Auth - User found:',
      user
        ? {
            id: user.id,
            account: user.account,
            name: user.name,
            hasPassword: !!user.passwordHash,
          }
        : 'No user found'
    )

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    if (!user.passwordHash) {
      return res.status(401).json({ error: 'No password set for user' })
    }

    // Test password comparison
    console.log('Debug Auth - Testing password...')
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    console.log('Debug Auth - Password valid:', isValidPassword)

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' })
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.account,
        name: user.name || user.account.split('@')[0],
      },
    })
  } catch (error) {
    console.error('Debug Auth - Error:', error)
    return res.status(500).json({
      error: 'Authentication debug failed',
      details: error.message,
    })
  }
}
