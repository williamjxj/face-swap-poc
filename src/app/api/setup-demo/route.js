import { NextResponse } from 'next/server'
import { createUser, findUserByEmail } from '@/lib/supabase-db'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const DEMO_USER = {
  email: 'demo@example.com',
  password: '123456',
  name: 'Demo User',
}

export async function POST(_request) {
  try {
    // Check if demo user already exists
    const existingUser = await findUserByEmail(DEMO_USER.email)

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Demo user already exists',
        user: { email: existingUser.email, name: existingUser.name },
      })
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(DEMO_USER.password, 10)

    // Create demo user
    const newUser = await createUser({
      id: uuidv4(),
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      password_hash: passwordHash,
    })

    return NextResponse.json({
      success: true,
      message: 'Demo user created successfully',
      user: { email: newUser.email, name: newUser.name },
      credentials: {
        email: DEMO_USER.email,
        password: DEMO_USER.password,
      },
    })
  } catch (error) {
    console.error('Error setting up demo user:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to setup demo user',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Demo user setup endpoint. Use POST to create demo user.',
    demoCredentials: {
      email: DEMO_USER.email,
      password: DEMO_USER.password,
    },
  })
}
