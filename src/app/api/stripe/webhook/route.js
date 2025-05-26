import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import stripe from '@/lib/stripe'
import prisma from '@/lib/db'

// This is your Stripe CLI webhook secret for testing your endpoint locally
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

// Check if Payment model exists in Prisma schema
const paymentModelExists = !!prisma.payment
console.log(`Payment model exists in Prisma: ${paymentModelExists}`)

export async function POST(req) {
  console.log('Stripe webhook received')
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  let event

  try {
    // Verify the event came from Stripe
    if (!endpointSecret) {
      console.warn('Webhook secret not configured, skipping signature verification')
      event = JSON.parse(body)
      console.log('Parsed raw webhook JSON:', event.type)
    } else {
      console.log('Verifying Stripe signature with secret')
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
      console.log('Stripe signature verified successfully')
    }
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`)
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
          const videoExists = await prisma.generatedMedia.findUnique({
            where: { id: videoId },
            select: { id: true },
          })

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
          const updatedVideo = await prisma.generatedMedia.update({
            where: { id: videoId },
            data: { isPaid: true },
          })

          console.log(`Payment successful, video marked as paid:`, updatedVideo)

          // Also create a payment record in the database
          // Skip payment creation if there's no Payment model available
          if (prisma.payment) {
            try {
              // Only try to create a payment record if we have a valid author ID
              if (updatedVideo.authorId) {
                // Common payment data
                const paymentData = {
                  amount: parseFloat(session.amount_total) / 100,
                  currency: session.currency.toUpperCase(),
                  status: 'completed',
                  type: 'fiat',
                  userId: updatedVideo.authorId,
                  generatedMediaId: videoId,
                }

                await prisma.payment.create({ data: paymentData })
                console.log(`Payment record created successfully`)
              } else {
                console.log('Cannot create payment record: No valid authorId found for video')
              }
            } catch (paymentError) {
              // Don't fail the whole process if payment record creation fails
              console.error(`Error creating payment record: ${paymentError.message}`)
            }
          } else {
            console.log(
              'Payment model not available in Prisma client, skipping payment record creation'
            )
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
