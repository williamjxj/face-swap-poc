'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCanceledPage() {
  const searchParams = useSearchParams();
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    const method = searchParams.get('method');
    setPaymentMethod(method || 'stripe');
  }, [searchParams]);

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6 flex justify-center">
          <XCircle className="h-16 w-16 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Payment Canceled</h1>
        
        <p className="text-gray-600 mb-6">
          Your payment process has been canceled. No charges were made to your account.
          {paymentMethod && (
            <span className="block mt-2 text-sm">
              Payment method: {paymentMethod === 'stripe' ? 'Credit Card' : 'Cryptocurrency'}
            </span>
          )}
        </p>
        
        <div className="mt-8">
          <Link 
            href="/" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors duration-300"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
