'use client';

import { useEffect, useState } from 'react';
import { getJSON } from '@/lib/api';
import { session } from '@/lib/session';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';

export default function MePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [linkedinStatus, setLinkedinStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = session.access();

    if (!token) {
      router.replace('/login');
      return;
    }

    // Fetch both user profile and LinkedIn status
    Promise.all([getJSON('/me', token), getJSON('/api/linkedin/status', token)])
      .then(([userData, linkedinData]) => {
        setUser(userData.user);
        setLinkedinStatus(linkedinData);
        setLoading(false);
      })
      .catch(error => {
        console.error('Profile request failed:', error);
        session.clear();
        router.replace('/login');
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">
                  {user.first_name?.[0] || user.email?.[0] || 'U'}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome, {user.first_name || 'User'}!
              </h1>
              <p className="text-gray-600">Here's your profile information</p>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      First Name
                    </label>
                    <p className="text-gray-900 font-medium">{user.first_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Last Name
                    </label>
                    <p className="text-gray-900 font-medium">{user.last_name || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    <p className="text-gray-900 font-medium">{user.email}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">User ID</label>
                    <p className="text-gray-500 text-sm font-mono">{user.id}</p>
                  </div>
                </div>
              </div>

              {/* LinkedIn Connection Status */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">LinkedIn Connection</h2>
                {linkedinStatus?.connected ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-green-700 font-medium">LinkedIn Connected</p>
                        <p className="text-sm text-gray-600">
                          {linkedinStatus.profile_data?.name || 'Profile connected successfully'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        Connected:{' '}
                        {linkedinStatus.connected_at
                          ? new Date(linkedinStatus.connected_at).toLocaleDateString()
                          : 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Expires:{' '}
                        {linkedinStatus.expires_at
                          ? new Date(linkedinStatus.expires_at).toLocaleDateString()
                          : 'Unknown'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.064-2.064 2.064zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-700 font-medium">LinkedIn Not Connected</p>
                        <p className="text-sm text-gray-600">
                          Connect your LinkedIn account to start posting content
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/linkedin-connect"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 shadow-lg hover:shadow-xl"
                    >
                      Connect LinkedIn
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    session.clear();
                    router.replace('/login');
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-lg hover:shadow-xl"
                >
                  Sign Out
                </button>
                <Link
                  href="/"
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-lg hover:shadow-xl text-center"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
