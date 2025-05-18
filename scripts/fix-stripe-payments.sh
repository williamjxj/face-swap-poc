#!/bin/bash

echo "=== Stripe Payment Fixer ==="
echo ""
echo "This script will help fix Stripe payment issues by updating the Prisma client"

# Check if npx is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Make sure npm is installed correctly."
    exit 1
fi

echo ""
echo "1. Generating Prisma client..."
npx prisma generate

echo ""
echo "2. Testing Payment model access..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    if (prisma.payment) {
      console.log('✅ Payment model available in Prisma client');
      const modelInfo = await prisma.$queryRaw\`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'Payment'
      \`;
      console.log('Database Payment table:', modelInfo.length ? '✅ Found' : '❌ Not found');
    } else {
      console.log('❌ Payment model NOT available in Prisma client');
    }
  } catch (e) {
    console.error('Error checking Payment model:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
"

echo ""
echo "3. Manually updating a video as paid..."
echo "To manually mark a video as paid, run:"
echo "UPDATE \"GeneratedMedia\" SET \"isPaid\" = true WHERE id = 'your-video-id';"

echo ""
echo "4. Verifying webhook endpoint..."
echo "Testing webhook endpoint with curl:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/stripe/webhook -X POST \
  -H "Content-Type: application/json" \
  -d '{"type":"ping","data":{"object":{"id":"test"}}}' \
  | grep -q "200" && echo "✅ Endpoint responded with 200" || echo "❌ Endpoint did not respond with 200"

echo ""
echo "5. How to register a webhook in Stripe dashboard:"
echo "a. Go to https://dashboard.stripe.com/webhooks"
echo "b. Click 'Add endpoint'"
echo "c. Enter your endpoint URL: https://your-domain.com/api/stripe/webhook"
echo "d. Select 'checkout.session.completed' event"
echo "e. Get the signing secret and set it as STRIPE_WEBHOOK_SECRET in your .env file"

echo ""
echo "Run this script again after making changes to verify the fix."
