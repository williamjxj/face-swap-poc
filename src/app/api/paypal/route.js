import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(request) {
  try {
    const { orderID, videoId } = await request.json()

    if (!orderID || !videoId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    console.log(`PayPal payment verification for order: ${orderID}, video: ${videoId}`)

    // Verify the PayPal payment with PayPal API
    const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET

    if (!paypalClientId || !paypalClientSecret) {
      console.error('PayPal configuration missing:', {
        hasClientId: !!paypalClientId,
        hasClientSecret: !!paypalClientSecret,
      })
      return NextResponse.json({ error: 'PayPal configuration missing' }, { status: 500 })
    }

    // Get PayPal access token
    const authResponse = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en_US',
        Authorization: `Basic ${Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!authResponse.ok) {
      throw new Error('Failed to get PayPal access token')
    }

    const authData = await authResponse.json()
    const accessToken = authData.access_token

    // Verify the order with PayPal
    const orderResponse = await fetch(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!orderResponse.ok) {
      throw new Error('Failed to verify PayPal order')
    }

    const orderData = await orderResponse.json()

    // Check if payment was completed
    if (orderData.status === 'COMPLETED') {
      console.log('PayPal payment verified successfully')

      // Update the video to mark it as paid
      const updatedVideo = await prisma.generatedMedia.update({
        where: { id: videoId },
        data: { isPaid: true },
      })

      console.log(`Video ${videoId} marked as paid via PayPal`)

      // Create payment record if Payment model exists
      if (prisma.payment) {
        try {
          const paymentAmount = parseFloat(orderData.purchase_units[0].amount.value)
          const paymentCurrency = orderData.purchase_units[0].amount.currency_code

          await prisma.payment.create({
            data: {
              amount: paymentAmount,
              currency: paymentCurrency,
              status: 'completed',
              type: 'paypal',
              userId: updatedVideo.authorId,
              generatedMediaId: videoId,
              paypalOrderId: orderID,
            },
          })

          console.log('PayPal payment record created successfully')
        } catch (paymentError) {
          console.error('Error creating PayPal payment record:', paymentError)
          // Continue even if payment record creation fails
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified and video unlocked',
        videoId: videoId,
      })
    } else {
      return NextResponse.json(
        {
          error: 'Payment not completed',
          status: orderData.status,
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('PayPal payment verification error:', error)
    return NextResponse.json(
      {
        error: 'Failed to verify PayPal payment',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
