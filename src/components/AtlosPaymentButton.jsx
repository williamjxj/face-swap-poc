'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import atlos, { generateOrderId, formatAmount } from '@/lib/atlos';

export default function AtlosPaymentButton({ amount, onSuccess, onCanceled }) {
  const [isAtlosLoaded, setIsAtlosLoaded] = useState(false);
  const [orderId] = useState(() => generateOrderId());
  
  // Handle Atlos payment success
  const handleSuccess = (result) => {
    console.log('Atlos payment success:', result);
    if (typeof onSuccess === 'function') {
      onSuccess(result);
    }
  };
  
  // Handle Atlos payment canceled
  const handleCanceled = (result) => {
    console.log('Atlos payment canceled:', result);
    if (typeof onCanceled === 'function') {
      onCanceled(result);
    }
  };
  
  // Initialize Atlos payment
  const handleAtlosPayment = () => {
    if (!window.atlos) {
      console.error('Atlos is not loaded yet');
      return;
    }
    
    const formattedAmount = formatAmount(amount);
    
    window.atlos.Pay({
      merchantId: atlos.MERCHANT_ID,
      orderId: orderId,
      orderAmount: formattedAmount,
      orderCurrency: 'USD',
      onSuccess: handleSuccess,
      onCanceled: handleCanceled,
      onCompleted: handleSuccess
    });
  };
  
  // Handle script load
  const handleScriptLoad = () => {
    console.log('Atlos script loaded');
    setIsAtlosLoaded(true);
  };

  return (
    <div className="atlos-payment">
      <Script
        src="https://atlos.io/packages/app/atlos.js"
        onLoad={handleScriptLoad}
        strategy="lazyOnload"
      />
      
      <button
        onClick={handleAtlosPayment}
        disabled={!isAtlosLoaded}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
      >
        <span className="mr-2">Pay with Crypto</span>
        {!isAtlosLoaded && <span className="loading-spinner"></span>}
      </button>
    </div>
  );
}
