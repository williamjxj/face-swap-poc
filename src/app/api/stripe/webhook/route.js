import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import stripe from '@/lib/stripe'
import { getGeneratedMediaById, updateGeneratedMedia, createPayment } from '@/lib/supabase-db'

// This is your Stripe CLI webhook secret for testing your endpoint locally
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

// Configure the route to handle raw body for webhook signature verification
export const runtime = 'nodejs'

export async function POST(req) {
  console.log('Stripe webhook received')

  let body
  let sig

  try {
    body = await req.text()
    const headersList = await headers()
    sig = headersList.get('stripe-signature')

    console.log('Webhook body length:', body.length)
    console.log('Signature header present:', !!sig)
    console.log('Endpoint secret configured:', !!endpointSecret)
  } catch (err) {
    console.error('Error reading webhook request:', err.message)
    return NextResponse.json({ error: 'Failed to read request' }, { status: 400 })
  }

  let event

  try {
    // Verify the event came from Stripe
    if (!endpointSecret) {
      console.warn('Webhook secret not configured, skipping signature verification')
      event = JSON.parse(body)
      console.log('Parsed raw webhook JSON:', event.type)
    } else if (!sig) {
      console.error('No Stripe signature header found')
      return NextResponse.json({ error: 'No signature header' }, { status: 400 })
    } else {
      console.log('Verifying Stripe signature with secret')

      // For development, try signature verification but don't fail if it doesn't work
      try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
        console.log('Stripe signature verified successfully')
      } catch (sigError) {
        console.warn(
          'Signature verification failed, but continuing in development mode:',
          sigError.message
        )

        // In development, parse the JSON directly if signature fails
        if (process.env.NODE_ENV === 'development') {
          console.warn('Development mode: parsing webhook without signature verification')
          event = JSON.parse(body)
        } else {
          // In production, fail if signature verification fails
          throw sigError
        }
      }
    }
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    console.error('Signature:', sig)
    console.error('Body preview:', body.substring(0, 100))
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  // Handle specific event types
  try {
    console.log(`Processing webhook event type: ${event.type}`)

    if (event.type === 'checkout.session.completed') {
      // Payment was successful
      const session = event.data.object
      console.log('Checkout session completed:', session.id)
      console.log('Session metadata:', JSON.stringify(session.metadata))

      // Extract video ID from metadata
      const videoId = session.metadata?.videoId

      if (videoId) {
        console.log(`Attempting to update isPaid for video ID: ${videoId}`)

        try {
          // Check if video exists first
          const videoExists = await getGeneratedMediaById(videoId)

          if (!videoExists) {
            console.error(`Video with ID ${videoId} not found in database`)
            return NextResponse.json(
              {
                error: `Video not found: ${videoId}`,
              },
              { status: 404 }
            )
          }

          // Update the video to mark it as paid
          const updatedVideo = await updateGeneratedMedia(videoId, { is_paid: true })

          console.log(`Payment successful, video marked as paid:`, updatedVideo)

          // Also create a payment record in the database
          try {
            // Only try to create a payment record if we have a valid author ID
            if (updatedVideo.author_id) {
              // Common payment data
              const paymentData = {
                amount: parseFloat(session.amount_total) / 100,
                currency: session.currency.toUpperCase(),
                status: 'completed',
                type: 'fiat',
                user_id: updatedVideo.author_id,
                generated_media_id: videoId,
              }

              await createPayment(paymentData)
              console.log(`Payment record created successfully`)
            } else {
              console.log('Cannot create payment record: No valid author_id found for video')
            }
          } catch (paymentError) {
            // Don't fail the whole process if payment record creation fails
            console.error(`Error creating payment record: ${paymentError.message}`)
          }

          console.log(`Payment record created successfully`)
        } catch (dbError) {
          console.error(`Database error updating video payment status: ${dbError.message}`)
          console.error(dbError.stack)
          return NextResponse.json(
            {
              error: `Database error: ${dbError.message}`,
            },
            { status: 500 }
          )
        }
      } else {
        console.warn('Video ID not found in session metadata')
      }
    }

    return NextResponse.json({ received: true, success: true })
  } catch (err) {
    console.error(`Error processing webhook event: ${err.message}`)
    console.error(err.stack)
    return NextResponse.json({ error: `Webhook handler error: ${err.message}` }, { status: 500 })
  }
}
