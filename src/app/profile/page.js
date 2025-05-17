'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('profile');
  
  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
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
        {activeTab === 'profile' && session?.user && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-medium mb-4">User Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="mt-1">{session.user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">User ID</p>
                <p className="mt-1">{session.user.id ? `${session.user.id.substring(0, 8)}...` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="mt-1 flex items-center">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Active</span>
                </p>
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
  );
}
