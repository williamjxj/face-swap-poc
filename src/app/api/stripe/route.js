import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';

export async function POST(request) {
  try {
    const { name, description, amount, currency, imageId, imageUrl } = await request.json();

    if (!name || !description || !amount || !currency) {
      return NextResponse.json(
        { error: 'Missing required session details' },
        { status: 400 }
      );
    }

    // Get the base URL from environment variables
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Missing NEXT_PUBLIC_BASE_URL environment variable' },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: name,
              description: description,
              // Removed images to avoid URL validation error
            },
            unit_amount: Math.round(parseFloat(amount) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&method=stripe`,
      cancel_url: `${baseUrl}/payment/canceled?method=stripe`,
      metadata: {
        imageId: imageId || '',
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Stripe session' },
      { status: 500 }
    );
  }
}
