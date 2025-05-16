'use client';

import { useState } from 'react';
import Script from 'next/script';
import { CreditCard } from 'lucide-react';
import atlos, { generateOrderId, formatAmount } from '@/lib/atlos';

export default function AtlosCheckoutButton({ video, disabled = false }) {
  const [isAtlosLoaded, setIsAtlosLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orderId] = useState(() => generateOrderId());
  
  // Handle Atlos payment success
  const handleSuccess = (result) => {
    console.log('Atlos payment success:', result);
    // You might want to redirect to a success page or update the UI
  };
  
  // Handle Atlos payment canceled
  const handleCanceled = (result) => {
    console.log('Atlos payment canceled:', result);
    setIsLoading(false);
    // You might want to update the UI or redirect
  };
  
  // Initialize Atlos payment
  const handleAtlosPayment = () => {
    if (!window.atlos) {
      console.error('Atlos is not loaded yet');
      return;
    }
    
    setIsLoading(true);
    
    // Default amount - you can make this dynamic
    const amount = 20.00;
    const formattedAmount = formatAmount(amount);
    
    window.atlos.Pay({
      merchantId: atlos.MERCHANT_ID,
      orderId: orderId,
      orderAmount: formattedAmount,
      orderCurrency: 'USD',
      onSuccess: handleSuccess,
      onCanceled: handleCanceled,
      onCompleted: handleSuccess,
      metadata: {
        videoId: video.name,
        videoPath: video.filePath
      }
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
        disabled={!isAtlosLoaded || isLoading || disabled}
        className={`flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-md cursor-pointer transition duration-150 ease-in-out ${(!isAtlosLoaded || isLoading || disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <CreditCard className="w-4 h-4" />
        {isLoading ? 'Processing...' : 'Pay with Crypto'}
      </button>
    </div>
  );
}
