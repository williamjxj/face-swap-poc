import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10', // Use the latest API version
});


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { name, description, amount, currency } = req.body;

      if (!name || !description || !amount || !currency) {
        return res.status(400).json({ error: 'Missing required session details' });
      }

      // Get the base URL from environment variables
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      
      if (!baseUrl) {
        return res.status(500).json({ error: 'Missing NEXT_PUBLIC_BASE_URL environment variable' });
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
              },
              unit_amount: Math.round(parseFloat(amount) * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/checkout?status=success&session_id={CHECKOUT_SESSION_ID}&method=stripe`,
        cancel_url: `${baseUrl}/checkout?status=canceled&method=stripe`,
        metadata: {
          // order_id: 'some_order_id',
        },
      });

      res.status(200).json({ sessionId: session.id });
    } catch (error: any) {
      console.error('Stripe API Error:', error);
      res.status(500).json({ error: error.message || 'Failed to create Stripe session' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}

