'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AtlosPaymentButton from '@/components/AtlosPaymentButton';

export default function CryptoPaymentPage() {
  const router = useRouter();
  const [amount, setAmount] = useState(19.99);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handlePaymentSuccess = async (paymentResult) => {
    setLoading(true);
    try {
      // Record the transaction in your backend
      const response = await fetch('/api/payment/atlos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: paymentResult.orderId,
          paymentId: paymentResult.paymentId,
          amount: amount,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult({
          success: true,
          message: 'Payment completed successfully!',
          details: paymentResult
        });
        
        // Redirect after payment is successful (optional)
        // setTimeout(() => {
        //   router.push('/thank-you');
        // }, 2000);
      } else {
        setResult({
          success: false,
          message: 'There was a problem processing your payment.',
          details: data
        });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setResult({
        success: false,
        message: 'An error occurred while processing your payment.',
        details: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentCanceled = () => {
    setResult({
      success: false,
      message: 'Payment was canceled.',
    });
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Crypto Payment Demo</h1>
      
      {/* Payment amount input */}
      <div className="mb-6">
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          Payment Amount (USD)
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
          className="w-full px-4 py-2 border rounded-md"
          min="1"
          step="0.01"
        />
      </div>
      
      {/* Atlos Payment Button */}
      <div className="mb-6">
        <AtlosPaymentButton
          amount={amount}
          onSuccess={handlePaymentSuccess}
          onCanceled={handlePaymentCanceled}
        />
        <p className="text-sm text-gray-500 mt-2">
          Pay with Bitcoin, Ethereum, and other cryptocurrencies
        </p>
      </div>
      
      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2">Processing payment...</p>
        </div>
      )}
      
      {/* Result message */}
      {result && (
        <div className={`p-4 rounded-md mt-4 ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <p className="font-medium">{result.message}</p>
          {result.details && (
            <pre className="mt-2 text-xs overflow-auto max-h-40 p-2 bg-gray-100 rounded">
              {JSON.stringify(result.details, null, 2)}
            </pre>
          )}
        </div>
      )}
      
      {/* Additional info */}
      <div className="mt-8 p-4 bg-blue-50 rounded-md text-sm">
        <h3 className="font-medium text-blue-700 mb-2">About Crypto Payments</h3>
        <p>
          Cryptocurrency payments are processed securely through Atlos. You can pay with 
          Bitcoin (BTC), Ethereum (ETH), Tether (USDT), USD Coin (USDC), and many other cryptocurrencies.
        </p>
      </div>
    </div>
  );
}
