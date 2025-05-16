import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import crypto from 'crypto';

// Helper to verify Atlos webhook signature
function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(digest, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

export async function POST(request) {
  try {
    // Get the raw request body as text
    const rawBody = await request.text();
    const signature = request.headers.get('x-atlos-signature');
    
    // Skip signature verification in development or if webhook secret is not set
    // In production, you should always verify the signature
    if (process.env.NODE_ENV === 'production' && process.env.ATLOS_WEBHOOK_SECRET) {
      if (!verifySignature(rawBody, signature, process.env.ATLOS_WEBHOOK_SECRET)) {
        return NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }
    
    // Parse the JSON body
    const data = JSON.parse(rawBody);
    
    // Check if this is a payment notification
    if (data.event === 'payment.completed') {
      const { orderId, transactionId, amount, currency } = data.data;
      
      // Record the payment in the database
      await prisma.payment.create({
        data: {
          orderId,
          transactionId,
          amount: parseFloat(amount),
          currency,
          provider: 'atlos',
          status: 'completed',
          metadata: data
        }
      });
      
      // Here you would typically update the user's credits or unlock content
      // based on the payment success
      
      return NextResponse.json({ success: true });
    }
    
    // For other webhook events
    return NextResponse.json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Error processing Atlos webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
