import { NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/services/auth'
import { getGeneratedMediaById, updateGeneratedMedia, createPayment } from '@/lib/supabase-db'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('session_id')
  const paypalOrderId = searchParams.get('paypal_order_id')
  const method = searchParams.get('method')
  const videoId = searchParams.get('video_id')

  console.log(`Payment success route called with method: ${method}`)

  // Handle PayPal payments
  if (method === 'paypal' && paypalOrderId && videoId) {
    console.log(`PayPal payment success for order: ${paypalOrderId}, video: ${videoId}`)

    try {
      // Verify PayPal payment
      const verifyResponse = await fetch(`${request.nextUrl.origin}/api/paypal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderID: paypalOrderId,
          videoId: videoId,
        }),
      })

      if (verifyResponse.ok) {
        console.log('PayPal payment verified successfully')
        return NextResponse.redirect(new URL(`/gallery?paymentSuccess=${videoId}`, request.url))
      } else {
        console.error('PayPal payment verification failed')
        return NextResponse.redirect(
          new URL('/face-fusion?tab=history&paymentFailed=true', request.url)
        )
      }
    } catch (error) {
      console.error('Error verifying PayPal payment:', error)
      return NextResponse.redirect(
        new URL('/face-fusion?tab=history&paymentFailed=true', request.url)
      )
    }
  }

  // Handle Stripe payments (existing logic)
  if (!sessionId) {
    console.log('No session ID provided, redirecting to home')
    return NextResponse.redirect(new URL('/', request.url))
  }

  try {
    // Get current user session
    const userSession = await getServerSession(authOptions)
    const currentUserId = userSession?.user?.id
    // Retrieve the session from Stripe to verify payment
    console.log('Retrieving session from Stripe')
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    console.log(`Session retrieved, payment status: ${session.payment_status}`)
    console.log('Session metadata:', JSON.stringify(session.metadata))

    // Check if payment was successful
    if (session.payment_status === 'paid') {
      // Get video ID from metadata
      const videoId = session.metadata?.videoId || ''
      console.log(`Payment successful for video ID: ${videoId}`)

      if (videoId) {
        // FALLBACK: Update the isPaid status in case the webhook didn't work
        try {
          console.log('Attempting fallback update of isPaid status')

          // Check if video exists and is already paid
          const video = await getGeneratedMediaById(videoId)

          if (!video) {
            console.error(`Video with ID ${videoId} not found in database`)
          } else if (video.is_paid) {
            console.log(`Video ${videoId} is already marked as paid`)
          } else {
            // Update the video to mark it as paid
            await updateGeneratedMedia(videoId, { is_paid: true })

            console.log(`Fallback: Video ${videoId} marked as paid`)

            // Create payment record if it doesn't exist
            try {
              // Check if payment already exists
              const { data: existingPayments } = await supabase
                .from('payments')
                .select('*')
                .eq('generated_media_id', videoId)
                .eq('status', 'completed')
                .limit(1)

              if (!existingPayments || existingPayments.length === 0) {
                // Determine which user ID to use (current user takes priority over video author)
                const userId = currentUserId || video.author_id

                if (userId) {
                  // Common payment data
                  const paymentData = {
                    amount: parseFloat(session.amount_total) / 100,
                    currency: session.currency.toUpperCase(),
                    status: 'completed',
                    type: 'fiat',
                    user_id: userId,
                    generated_media_id: videoId,
                  }

                  await createPayment(paymentData)

                  const userSource = currentUserId ? 'current user' : 'video author'
                  console.log(`Fallback: Created payment record for ${userSource}: ${userId}`)
                } else {
                  console.log('Cannot create payment record: No valid user ID found')
                }
              } else {
                console.log('Payment record already exists for this video')
              }
            } catch (paymentError) {
              console.error('Error handling payment record:', paymentError.message)
              // Continue execution even if payment record handling fails
            }
          }
        } catch (dbError) {
          console.error('Error updating payment status:', dbError)
        }
      }

      // Redirect to gallery with payment success param
      console.log(`Redirecting to gallery with success param: ${videoId}`)
      return NextResponse.redirect(new URL(`/gallery?paymentSuccess=${videoId}`, request.url))
    } else {
      // Redirect to home if payment was not successful
      console.log('Payment was not successful, redirecting to home')
      return NextResponse.redirect(new URL('/', request.url))
    }
  } catch (error) {
    console.error('Error retrieving Stripe session:', error)
    return NextResponse.redirect(new URL('/', request.url))
  }
}
