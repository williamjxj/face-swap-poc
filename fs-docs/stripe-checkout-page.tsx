'use client';
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_PLACEHOLDER');

export default function CheckoutPage() {
  const [paymentStatus, setPaymentStatus] = useState('');
  const [isLoadingCrypto, setIsLoadingCrypto] = useState(false);
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const status = query.get('status');
    const method = query.get('method');
    const sessionId = query.get('session_id'); // For Stripe
    const chargeId = query.get('charge_id'); // For Coinbase

    if (status === 'success') {
      if (method === 'stripe' && sessionId) {
        setPaymentStatus(`Stripe payment successful! Session ID: ${sessionId}. You will receive a confirmation email shortly.`);
      } else if (method === 'coinbase' && chargeId) {
        setPaymentStatus(`Coinbase payment successful! Charge ID: ${chargeId}. Your payment is being processed.`);
      } else {
        setPaymentStatus('Payment successful! You will receive a confirmation email shortly.');
      }
    } else if (status === 'canceled') {
      if (method === 'stripe') {
        setPaymentStatus('Stripe payment canceled. You have not been charged.');
      } else if (method === 'coinbase') {
        setPaymentStatus('Coinbase payment canceled. You have not been charged.');
      } else {
        setPaymentStatus('Payment canceled. You have not been charged.');
      }
    } else if (status === 'error') {
        const errorMessage = query.get('message') || 'An unknown error occurred during payment.';
        setPaymentStatus(`Payment Error: ${decodeURIComponent(errorMessage)}`);
    }
  }, []);

  const handleCryptoPayment = async () => {
    setIsLoadingCrypto(true);
    setPaymentStatus('Processing Cryptocurrency Payment...');
    try {
      const response = await fetch('/api/create-coinbase-charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Example Crypto Product',
          description: 'This is an example product for testing Coinbase Commerce.',
          amount: '0.10', // Example amount, ensure it meets Coinbase minimums if any
          currency: 'USD',
        }),
      });

      const data = await response.json() || {};

      if (response.ok && data.charge && data.charge.hosted_url) {
        window.location.href = data.charge.hosted_url;
      } else {
        console.error('Failed to create Coinbase charge:', data.error);
        setPaymentStatus(`Error: ${data.error || 'Failed to initiate crypto payment.'}`);
        setIsLoadingCrypto(false);
      }
    } catch (error: any) {
      console.error('Error during crypto payment:', error);
      setPaymentStatus(`Error: ${error.message || 'An unexpected error occurred.'}`);
      setIsLoadingCrypto(false);
    }
  };

  const handleStripePayment = async () => {
    setIsLoadingStripe(true);
    setPaymentStatus('Initiating Stripe Payment...');
    try {
      const response = await fetch('/api/create-stripe-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Example Stripe Product',
          description: 'Monthly subscription for our service (Stripe)',
          amount: '20.00',
          currency: 'USD',
        }),
      });

      const { sessionId, error: sessionError } = await response.json();

      if (sessionError) {
        console.error('Failed to create Stripe session:', sessionError);
        setPaymentStatus(`Error: ${sessionError || 'Failed to initiate Stripe payment.'}`);
        setIsLoadingStripe(false);
        return;
      }

      if (!sessionId) {
        setPaymentStatus('Error: Could not retrieve session ID for Stripe.');
        setIsLoadingStripe(false);
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) {
        setPaymentStatus('Error: Stripe.js has not loaded yet.');
        setIsLoadingStripe(false);
        return;
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        console.error('Stripe redirect error:', error);
        setPaymentStatus(`Error: ${error.message || 'Failed to redirect to Stripe.'}`);
        setIsLoadingStripe(false);
      }
    } catch (error: any) {
      console.error('Error during Stripe payment:', error);
      setPaymentStatus(`Error: ${error.message || 'An unexpected error occurred.'}`);
      setIsLoadingStripe(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>
      <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-6">Payment Options</h2>
        <div className="space-y-4">
          <button
            className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out ${isLoadingCrypto || isLoadingStripe ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleCryptoPayment}
            disabled={isLoadingCrypto || isLoadingStripe}
          >
            {isLoadingCrypto ? 'Processing...' : 'Pay with Cryptocurrency'}
          </button>
          <button
            className={`w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out ${isLoadingCrypto || isLoadingStripe ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleStripePayment}
            disabled={isLoadingStripe || isLoadingCrypto}
          >
            {isLoadingStripe ? 'Processing...' : 'Pay with Stripe'}
          </button>
        </div>
        {paymentStatus && (
          <div id="payment-status" className={`mt-6 text-center p-3 rounded ${paymentStatus.toLowerCase().includes('error') || paymentStatus.toLowerCase().includes('cancel') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700' }`}>
            {paymentStatus}
          </div>
        )}
      </div>
    </div>
  );
}

