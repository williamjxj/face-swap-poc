'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AtlosPaymentButton from '@/components/AtlosPaymentButton';

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Mock user data - in a real app, this would come from your authentication system
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    credits: 10,
    membership: 'Basic'
  };
  
  // Payment package options
  const packages = [
    { id: 'basic', name: 'Basic', credits: 10, price: 9.99 },
    { id: 'standard', name: 'Standard', credits: 25, price: 19.99 },
    { id: 'premium', name: 'Premium', credits: 75, price: 49.99 }
  ];
  
  // Handle successful payment
  const handlePaymentSuccess = (result, packageInfo) => {
    console.log('Payment successful:', result);
    // In a real app, you would update the user's credits/membership here
    alert(`Thank you for purchasing the ${packageInfo.name} package! ${packageInfo.credits} credits have been added to your account.`);
  };
  
  return (
    <div className="flex-grow p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Your Account</h1>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-4 px-1 ${
                activeTab === 'profile'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`pb-4 px-1 ${
                activeTab === 'payments'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Payments
            </button>
          </nav>
        </div>
        
        {/* Tab content */}
        {activeTab === 'profile' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-medium mb-4">User Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="mt-1">{user.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="mt-1">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Membership</p>
                <p className="mt-1">{user.membership}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Available Credits</p>
                <p className="mt-1 text-lg font-semibold">{user.credits}</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'payments' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-medium mb-4">Add Credits</h2>
            <p className="mb-4 text-gray-600">Purchase additional credits to use for face swaps.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {packages.map((pkg) => (
                <div key={pkg.id} className="border rounded-lg p-4 text-center">
                  <h3 className="text-lg font-semibold mb-1">{pkg.name} Package</h3>
                  <p className="text-2xl font-bold mb-2">${pkg.price}</p>
                  <p className="text-gray-600 mb-4">{pkg.credits} credits</p>
                  <AtlosPaymentButton 
                    amount={pkg.price} 
                    onSuccess={(result) => handlePaymentSuccess(result, pkg)}
                  />
                </div>
              ))}
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">About Cryptocurrency Payments</h3>
              <p className="text-sm text-blue-700">
                We accept payments in Bitcoin, Ethereum, USDT, USDC and other cryptocurrencies.
                All transactions are secure and processed instantly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
