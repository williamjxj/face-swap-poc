export default async function handler(req, res) {
  try {
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL
        ? 'SET (length: ' + process.env.DATABASE_URL.length + ')'
        : 'NOT SET',
      DIRECT_URL: process.env.DIRECT_URL
        ? 'SET (length: ' + process.env.DIRECT_URL.length + ')'
        : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET
        ? 'SET (length: ' + process.env.NEXTAUTH_SECRET.length + ')'
        : 'NOT SET',

      // Show partial database URL for debugging (without credentials)
      DATABASE_URL_PREVIEW: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@').substring(0, 100) + '...'
        : 'NOT SET',

      // Check if specific parts exist
      HAS_SUPABASE_URL: process.env.DATABASE_URL?.includes('supabase.co') || false,
      HAS_POSTGRES_USER: process.env.DATABASE_URL?.includes('postgres:') || false,
      HAS_DATABASE_NAME: process.env.DATABASE_URL?.includes('/postgres') || false,

      timestamp: new Date().toISOString(),
    }

    // If there's a debug parameter, show more details
    if (req.query.debug === 'true') {
      envCheck.fullDatabaseUrl = process.env.DATABASE_URL || 'NOT SET'
    }

    return res.status(200).json({
      success: true,
      environment: envCheck,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
