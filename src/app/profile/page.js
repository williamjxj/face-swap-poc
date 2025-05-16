'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
            <h2 className="text-xl font-medium mb-4">Payment History</h2>
            <p className="mb-4 text-gray-600">View your payment history and transactions.</p>
            
            <div className="text-center py-8 text-gray-500">
              <p>No payment history available.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
