import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    console.log('🔗 DATABASE_URL exists:', !!process.env.DATABASE_URL)
    
    await db.$connect()
    console.log('✅ Connected to database')
    
    const email = 'jxjwilliam3@2925.com'
    const password = 'William1!'
    const name = 'William Jiang'
    
    console.log(`📧 Working with user: ${email}`)
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { account: email }
    })
    
    let result = {}
    
    if (existingUser) {
      console.log('👤 User already exists, updating password...')
      
      // Update password hash
      const passwordHash = await bcrypt.hash(password, 10)
      
      await db.user.update({
        where: { account: email },
        data: {
          passwordHash,
          name
        }
      })
      
      result.action = 'updated'
      result.message = 'User password updated successfully'
    } else {
      console.log('👤 Creating new user...')
      
      // Hash the password
      const passwordHash = await bcrypt.hash(password, 10)
      
      // Create user
      const user = await db.user.create({
        data: {
          account: email,
          name,
          passwordHash
        }
      })
      
      result.action = 'created'
      result.message = 'User created successfully'
      result.userId = user.id
    }
    
    // Verify the user can be found and password works
    const user = await db.user.findUnique({
      where: { account: email }
    })
    
    if (user && user.passwordHash) {
      const isValidPassword = await bcrypt.compare(password, user.passwordHash)
      result.passwordVerification = isValidPassword ? 'SUCCESS' : 'FAILED'
      result.userExists = true
      result.hasPasswordHash = !!user.passwordHash
    } else {
      result.passwordVerification = 'USER_NOT_FOUND'
      result.userExists = false
    }
    
    return NextResponse.json({
      success: true,
      ...result,
      testCredentials: {
        email,
        password
      }
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Missing'
    }, { status: 500 })
    
  } finally {
    await db.$disconnect()
  }
}
