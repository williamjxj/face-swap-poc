import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { client as coinbaseClient } from '@/lib/crypto';

export async function POST(request) {
  const { amount, currency, type } = await request.json();

  if (type === 'fiat') {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
    });
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  }

  if (type === 'crypto') {
    const charge = await coinbaseClient.charges.create({
      name: 'Face Swap Service',
      description: 'AI Face Swap Generation',
      pricing_type: 'fixed_price',
      local_price: {
        amount: amount.toString(),
        currency,
      },
    });
    return NextResponse.json({ chargeId: charge.id });
  }
}