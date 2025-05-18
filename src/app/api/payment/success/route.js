import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import prisma from '@/lib/db';

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');
  
  console.log(`Payment success route called with session ID: ${sessionId}`);
  
  // If no session ID is provided, redirect to home
  if (!sessionId) {
    console.log('No session ID provided, redirecting to home');
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  try {
    // Retrieve the session from Stripe to verify payment
    console.log('Retrieving session from Stripe');
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log(`Session retrieved, payment status: ${session.payment_status}`);
    console.log('Session metadata:', JSON.stringify(session.metadata));
    
    // Check if payment was successful
    if (session.payment_status === 'paid') {
      // Get video ID from metadata
      const videoId = session.metadata?.videoId || '';
      console.log(`Payment successful for video ID: ${videoId}`);
      
      if (videoId) {
        // FALLBACK: Update the isPaid status in case the webhook didn't work
        try {
          console.log('Attempting fallback update of isPaid status');
          
          // Check if video exists and is already paid
          const video = await prisma.generatedMedia.findUnique({
            where: { id: videoId }
          });
          
          if (!video) {
            console.error(`Video with ID ${videoId} not found in database`);
          } else if (video.isPaid) {
            console.log(`Video ${videoId} is already marked as paid`);
          } else {
            // Update the video to mark it as paid
            await prisma.generatedMedia.update({
              where: { id: videoId },
              data: { isPaid: true }
            });
            
            console.log(`Fallback: Video ${videoId} marked as paid`);
            
            // Create payment record if it doesn't exist and Payment model is available
            if (prisma.payment) {
              try {
                const existingPayment = await prisma.payment.findFirst({
                  where: {
                    generatedMediaId: videoId,
                    status: 'completed'
                  }
                });
                
                if (!existingPayment) {
                  await prisma.payment.create({
                    data: {
                      amount: parseFloat(session.amount_total) / 100,
                      currency: session.currency.toUpperCase(),
                      status: 'completed',
                      type: 'fiat',
                      userId: video.authorId || '00000000-0000-0000-0000-000000000000',
                      generatedMediaId: videoId
                    }
                  });
                  console.log('Fallback: Created payment record');
                }
              } catch (paymentError) {
                console.error('Error handling payment record:', paymentError.message);
                // Continue execution even if payment record handling fails
              }
            } else {
              console.log('Payment model not available in Prisma client, skipping payment record creation');
            }
          }
        } catch (dbError) {
          console.error('Error updating payment status:', dbError);
        }
      }
      
      // Redirect to history tab with payment success param
      console.log(`Redirecting to history tab with success param: ${videoId}`);
      return NextResponse.redirect(new URL(`/face-fusion?tab=history&paymentSuccess=${videoId}`, request.url));
    } else {
      // Redirect to home if payment was not successful
      console.log('Payment was not successful, redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch (error) {
    console.error('Error retrieving Stripe session:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
