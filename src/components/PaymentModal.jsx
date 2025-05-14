import { Elements } from '@stripe/stripe-js';
import { Web3Button } from '@web3modal/react';

export function PaymentModal({ amount, onSuccess }) {
  return (
    <div className="payment-modal">
      <h2>Choose Payment Method</h2>
      
      {/* Stripe Elements Integration */}
      <Elements stripe={stripePromise}>
        <StripePaymentForm amount={amount} onSuccess={onSuccess} />
      </Elements>

      {/* Crypto Payment Option */}
      <Web3Button />
    </div>
  );
}