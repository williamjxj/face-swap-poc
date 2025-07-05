import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const startTime = Date.now()

  try {
    // Test database connection with timeout
    const connectionTest = Promise.race([
      supabase.from('users').select('id').limit(1),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database connection timeout')), 10000)
      ),
    ])

    const result = await connectionTest
    const connectionTime = Date.now() - startTime

    // Test environment variables
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_URL_TYPE: dbUrl?.includes('pooler.supabase.com')
        ? 'pooler'
        : dbUrl?.includes('supabase.co')
          ? 'direct'
          : 'other',
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    }

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      connectionTime: `${connectionTime}ms`,
      dbResult: result,
      environment: envCheck,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const connectionTime = Date.now() - startTime
    console.error('Health check failed:', error)
    console.error('Connection attempt took:', `${connectionTime}ms`)

    const dbUrl = process.env.DATABASE_URL
    const maskedUrl = dbUrl ? dbUrl.replace(/:([^:@]+)@/, ':***@') : 'NOT_SET'

    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        connectionTime: `${connectionTime}ms`,
        error: error.message,
        errorCode: error.code,
        environment: {
          DATABASE_URL: !!process.env.DATABASE_URL,
          DATABASE_URL_MASKED: maskedUrl,
          DATABASE_URL_TYPE: dbUrl?.includes('pooler.supabase.com')
            ? 'pooler'
            : dbUrl?.includes('supabase.co')
              ? 'direct'
              : 'other',
          NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
          NEXTAUTH_URL: process.env.NEXTAUTH_URL,
          NODE_ENV: process.env.NODE_ENV,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
