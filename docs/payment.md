# Payment

- Implement Cryptocurrency Payment Integration in Next.js 15.2.4 Application Using Test/Sandbox Environment

## Stripe

- [Integrating Stripe Checkout with Next.js Is Easier Than You Think](https://hackernoon.com/integrating-stripe-checkout-with-nextjs-is-easier-than-you-think)
- STRIPE_WEBHOOK_SECRET==whsec_xxxx (checkout.session.completed)

```bash
# expost local to public
$ ngrok http 3000
# https://...ngrok-free.app/api/stripe/webhook
```

## Pay with Bitcoin, Ethereum, and other cryptocurrencies

## Coinbase

Use `Coinbase Commerce Sandbox API` or alternative test environments (e.g., Circle, BitPay)

- Register for a sandbox/test account
- Generate API test credentials
- No real cryptocurrency transactions required

Expected Deliverables:

1. Working payment flow in development environment
2. Basic error handling
3. Simple user interface
4. Test transaction demonstrations

Coinbase Commerce 官方明确说明：目前不提供沙盒/测试环境，因此无法像传统 API 一样获取用于沙盒环境的 API 密钥。
官方建议开发者如果需要测试，可以选择发送极小金额的加密货币（如比特币现金等低成本币种）进行实际环境下的测试操作。
“Commerce 目前不提供沙盒/测试环境。我们建议使用比特币现金等低成本货币发送少量加密货币以完成您的测试。”
总结：
• Coinbase Commerce 没有沙盒环境，也无法申请沙盒 API Key。
• 测试建议：在主网环境下用小额加密货币进行真实测试。
如果你需要沙盒环境测试功能，可以考虑其他支付网关或第三方加密支付服务。
