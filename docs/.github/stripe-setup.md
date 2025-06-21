# Stripe Integration Setup Guide

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price ID (NEW - from your Stripe Dashboard)
STRIPE_PRICE_ID=price_1234567890abcdef

# Base URL for redirects
NEXT_PUBLIC_BASE_URL=http://localhost:3000 # or your production URL
```

## How to Get Your Stripe Price ID

### 1. Login to Stripe Dashboard
- Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
- Switch to Test mode for development or Live mode for production

### 2. Create a Product (if not already created)
- Navigate to **Products** in the left sidebar
- Click **+ Add product**
- Fill in:
  - **Name**: "Video Purchase" (or your preferred name)
  - **Description**: "Purchase video content"
  - **Pricing**: Set your price (e.g., $4.96)
  - **Currency**: USD
  - **Billing**: One-time payment

### 3. Get the Price ID
- After creating the product, you'll see a **Price ID** like `price_1234567890abcdef`
- Copy this Price ID
- Add it to your `.env.local` file as `STRIPE_PRICE_ID=price_1234567890abcdef`

## Benefits of Using Stripe Price ID

### ✅ **Centralized Pricing**
- Price is managed in Stripe Dashboard
- No need to update code when changing prices
- Consistent pricing across all systems

### ✅ **Production Ready**
- Stripe handles currency conversion
- Built-in tax calculation support
- Automatic receipt generation

### ✅ **Better Analytics**
- Stripe Dashboard shows detailed analytics
- Revenue tracking and reporting
- Customer insights

## Fallback System

If `STRIPE_PRICE_ID` is not set, the system will fall back to:
- Custom pricing using `VIDEO_PRICE` from `src/config/pricing.js`
- Manual price_data creation in Stripe checkout

## Testing

### Test Mode
1. Use test Price ID: `price_1234567890abcdef` (from test mode)
2. Use test cards: `4242424242424242` (Visa)
3. Any future expiry date and CVC

### Production Mode
1. Use live Price ID from live mode
2. Real payment processing
3. Real customer charges

## Migration Steps

1. **Add Price ID to .env.local**
   ```bash
   STRIPE_PRICE_ID=price_your_actual_price_id_here
   ```

2. **Restart your development server**
   ```bash
   npm run dev
   ```

3. **Test the integration**
   - Go to gallery page
   - Try purchasing a video
   - Should use your Stripe Dashboard price

4. **Verify in Stripe Dashboard**
   - Check payment appears in Stripe Dashboard
   - Verify correct amount is charged
   - Confirm webhook events are received

## Troubleshooting

### Price ID Not Working
- Verify Price ID is correct in Stripe Dashboard
- Ensure you're using the right mode (test/live)
- Check environment variables are loaded correctly

### Fallback to Custom Pricing
- If Price ID is invalid, system uses fallback pricing
- Check console logs for Stripe API errors
- Verify Stripe secret key has correct permissions

### Webhook Issues
- Ensure webhook endpoint is configured in Stripe
- Verify webhook secret matches your environment variable
- Check webhook logs in Stripe Dashboard
