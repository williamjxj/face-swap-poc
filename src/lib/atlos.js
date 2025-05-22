// Atlos payment gateway integration
const MERCHANT_ID = process.env.NEXT_PUBLIC_ATLOS_MERCHANT_ID || 'WQRZ5YBYNX' // Fallback to hardcoded value if env var is not available

// Generate a unique order ID - you can replace this with your own logic
export function generateOrderId() {
  return `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`
}

// Helper function to format amount to 2 decimal places
export function formatAmount(amount) {
  return parseFloat(amount).toFixed(2)
}

const config = {
  MERCHANT_ID,
}

export default config
