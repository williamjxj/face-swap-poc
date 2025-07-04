import { NextResponse } from 'next/server'
import { getPaymentsByUser } from '@/lib/supabase-db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/services/auth'

// GET all payments for the current user
export async function GET() {
  try {
    // Get current user session
    const session = await getServerSession(authOptions)
    const currentUserId = session?.user?.id

    // For demo/POC: Show all payments regardless of user to maximize content visibility
    let payments = await getPaymentsByUser(null) // null = get all payments

    return NextResponse.json({
      payments: payments,
      total: payments.length,
      user: currentUserId,
    })
  } catch (error) {
    console.error('[PAYMENTS] Error fetching payments:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
