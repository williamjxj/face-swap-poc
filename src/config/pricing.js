// Centralized pricing configuration
// This file controls all payment prices across the application

export const PRICING_CONFIG = {
  // Stripe Price ID from dashboard (preferred method)
  STRIPE_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || null,

  // Fallback price for display and non-Stripe payments
  VIDEO_PRICE: '4.96', // Fallback if price ID is not available

  // Currency
  CURRENCY: 'USD',

  // Fallback price for display purposes
  FALLBACK_PRICE: '4.96',

  // Crypto pricing (can be different due to fees)
  CRYPTO_PRICE: '20.00', // Higher due to crypto transaction fees

  // Price display formatting
  formatPrice: price => {
    const numPrice = parseFloat(price || PRICING_CONFIG.VIDEO_PRICE)
    return numPrice.toFixed(2)
  },

  // Get price for specific payment method
  getPrice: (method = 'default') => {
    switch (method) {
      case 'crypto':
      case 'bitcoin':
      case 'atlos':
        return PRICING_CONFIG.CRYPTO_PRICE
      case 'stripe':
        // For Stripe, return price ID if available, otherwise fallback to amount
        return PRICING_CONFIG.STRIPE_PRICE_ID || PRICING_CONFIG.VIDEO_PRICE
      case 'paypal':
      case 'card':
      default:
        return PRICING_CONFIG.VIDEO_PRICE
    }
  },

  // Get Stripe price ID (preferred for Stripe checkout)
  getStripePriceId: () => {
    return PRICING_CONFIG.STRIPE_PRICE_ID
  },

  // Check if using Stripe price ID or fallback amount
  isUsingStripePriceId: () => {
    return !!PRICING_CONFIG.STRIPE_PRICE_ID
  },

  // Get formatted price with currency symbol
  getFormattedPrice: (method = 'default') => {
    const price = PRICING_CONFIG.getPrice(method)
    return `$${PRICING_CONFIG.formatPrice(price)}`
  },
}

// Export individual values for convenience
export const VIDEO_PRICE = PRICING_CONFIG.VIDEO_PRICE
export const CURRENCY = PRICING_CONFIG.CURRENCY
export const CRYPTO_PRICE = PRICING_CONFIG.CRYPTO_PRICE
export const STRIPE_PRICE_ID = PRICING_CONFIG.STRIPE_PRICE_ID

export default PRICING_CONFIG
