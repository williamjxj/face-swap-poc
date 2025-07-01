import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/services/auth'

export async function POST(_request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // This endpoint is deprecated in favor of Supabase Storage
    // Video optimization should be handled client-side or through external services
    return NextResponse.json(
      {
        error:
          'Video optimization endpoint is deprecated. Please use Supabase Storage for video processing.',
      },
      { status: 410 }
    )
  } catch (error) {
    console.error('Video optimization error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Video optimization failed',
      },
      { status: 500 }
    )
  }
}
