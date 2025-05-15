Implement Cryptocurrency Payment Integration in Next.js 15.2.4 Application Using Test/Sandbox Environment

Technical Requirements:
1. Use Coinbase Commerce Sandbox API or alternative test environments (e.g., Circle, BitPay)
- Register for a sandbox/test account
- Generate API test credentials
- No real cryptocurrency transactions required

Implementation Steps:
1. API Integration Setup
   - Configure environment variables for API keys
   - Install required SDK/dependencies
   - Set up webhook endpoints for payment notifications

2. Payment Flow Implementation
   - Create payment generation endpoint (/api/create-payment)
   - Implement payment status checking mechanism
   - Handle successful/failed transaction scenarios
   - Store transaction records in development database

3. User Interface Components
   - Payment initiation form
   - QR code/payment address display
   - Real-time payment status updates
   - Transaction confirmation page

Testing Requirements:
- Use mock cryptocurrency transactions
- Verify webhook handling
- Test payment status updates
- Validate error scenarios

Documentation References:
- Coinbase Commerce API Docs: https://docs.cloud.coinbase.com/commerce/docs
- Next.js API Routes: https://nextjs.org/docs/api-routes/introduction
- Environment Variables: https://nextjs.org/docs/basic-features/environment-variables

Expected Deliverables:
1. Working payment flow in development environment
2. Basic error handling
3. Simple user interface
4. Test transaction demonstrations

Note: Focus on functional implementation first, optimize for production later.

Coinbase Commerce 官方明确说明：目前不提供沙盒/测试环境，因此无法像传统 API 一样获取用于沙盒环境的 API 密钥。
官方建议开发者如果需要测试，可以选择发送极小金额的加密货币（如比特币现金等低成本币种）进行实际环境下的测试操作。
		“Commerce 目前不提供沙盒/测试环境。我们建议使用比特币现金等低成本货币发送少量加密货币以完成您的测试。”
总结：
	•	Coinbase Commerce 没有沙盒环境，也无法申请沙盒 API Key。
	•	测试建议：在主网环境下用小额加密货币进行真实测试。
如果你需要沙盒环境测试功能，可以考虑其他支付网关或第三方加密支付服务。

有没有其它具有沙盒环境测试功能的API？如果有，请替换coinbase
    •	Stripe：提供沙盒环境，支持多种支付方式，包括加密货币。
    •	BitPay：提供沙盒环境，专注于比特币和比特币现金支付。
    •	CoinGate：提供沙盒环境，支持多种加密货币支付。