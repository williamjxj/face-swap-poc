'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState({
    sessionId: '',
    paymentMethod: '',
  });

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const method = searchParams.get('method');
    
    setPaymentDetails({
      sessionId: sessionId || '',
      paymentMethod: method || 'stripe',
    });
  }, [searchParams]);

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6 flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Payment Successful!</h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your payment has been processed successfully.
          {paymentDetails.sessionId && (
            <span className="block mt-2 text-sm">
              Transaction ID: {paymentDetails.sessionId}
            </span>
          )}
        </p>
        
        <div className="mt-8">
          <Link 
            href="/profile" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors duration-300"
          >
            Go to My Profile
          </Link>
        </div>
        
        <div className="mt-4">
          <Link 
            href="/" 
            className="inline-block text-blue-600 hover:text-blue-800 transition-colors duration-300"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
