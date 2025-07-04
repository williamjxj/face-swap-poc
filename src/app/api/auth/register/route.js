import { NextResponse } from 'next/server'
import { findUserByEmail, createUser } from '@/lib/supabase-db'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request) {
  try {
    const data = await request.json()
    const { email, password, name } = data

    // Basic validation
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email)

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const user = await createUser({
      id: uuidv4(),
      email: email,
      password_hash: passwordHash,
      name: name || email.split('@')[0],
    })

    // Don't include the password hash in the response
    const { password_hash: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        user: userWithoutPassword,
        message: 'Registration successful',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 })
  }
}
