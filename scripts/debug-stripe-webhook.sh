#!/bin/bash

# Script to help debug Stripe webhook issues
echo "=== Stripe Webhook Debug Tool ==="
echo ""
echo "1. Verifying environment variables"

if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo "❌ STRIPE_SECRET_KEY is not set in your environment"
else
  echo "✅ STRIPE_SECRET_KEY is set"
fi

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
  echo "❌ STRIPE_WEBHOOK_SECRET is not set in your environment"
  echo "   Run 'stripe listen' to get a webhook signing secret"
else
  echo "✅ STRIPE_WEBHOOK_SECRET is set"
fi

echo ""
echo "2. Testing webhook endpoint"
echo "   Make sure your server is running on localhost:3000"
curl -s http://localhost:3000/api/stripe/webhook -X POST \
  -H "Content-Type: application/json" \
  -d '{"type":"ping","data":{"object":{"id":"test"}}}' \
  | grep -q 'received' && echo "✅ Endpoint is responding" || echo "❌ Endpoint is not responding correctly"

echo ""
echo "3. How to listen for webhook events"
echo "   Run this command in your terminal:"
echo "   $ stripe listen --forward-to http://localhost:3000/api/stripe/webhook"

echo ""
echo "4. How to trigger a test webhook event"
echo "   In a separate terminal, run:"
echo "   $ stripe trigger checkout.session.completed"

echo ""
echo "5. Check your database connection"
echo "   Make sure your database is running and accessible."

echo ""
echo "6. Manually update a video payment status"
echo "   To test if database updates work correctly, use this SQL:"
echo "   UPDATE \"GeneratedMedia\" SET \"isPaid\" = true WHERE id = 'your-video-id';"
echo ""
