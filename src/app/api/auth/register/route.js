import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const data = await request.json()
    const { email, password, name } = data

    // Basic validation
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { account: email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const user = await db.user.create({
      data: {
        account: email,
        passwordHash,
        name: name || email.split('@')[0],
        lastLogin: new Date(),
      },
    })

    // Don't include the password hash in the response
    const { passwordHash: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        user: userWithoutPassword,
        message: 'Registration successful',
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 })
  }
}
