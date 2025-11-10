'use client';
import { useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { session } from '@/lib/session';
import { API_URL } from '@/lib/api';

export default function LinkedInConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');

    try {
      // Get OAuth URL from backend with authentication
      const token = session.access();
      if (!token) {
        setError('Please log in first');
        return;
      }

      const response = await fetch(`${API_URL}/api/linkedin/auth`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        // Redirect to LinkedIn OAuth
        window.location.href = data.auth_url;
      } else {
        setError(data.detail || 'Failed to get LinkedIn auth URL');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    // TODO: Implement disconnect logic
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-brand-light p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-brand-dark text-white p-6 rounded-lg shadow-lg mb-6">
            <h1 className="text-3xl font-bold mb-2 text-brand-blue">Connect LinkedIn</h1>
            <p className="text-brand-light">
              Connect your LinkedIn account to start posting content
            </p>
          </div>

          {!isConnected ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-brand-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.064-2.064 2.064zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Connect Your LinkedIn Account
                </h2>
                <p className="text-gray-600 mb-6">
                  Authorize our app to post content on your behalf. We&apos;ll only post what you
                  create.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="bg-brand-blue text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
              >
                {isConnecting ? 'Connecting...' : 'Connect to LinkedIn'}
              </button>

              <div className="mt-6 text-sm text-gray-500">
                <p>• We&apos;ll redirect you to LinkedIn to authorize</p>
                <p>• You can revoke access anytime in LinkedIn settings</p>
                <p>• We only request permission to post content</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
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
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Successfully Connected!</h2>
              <p className="text-gray-600 mb-6">
                Your LinkedIn account is now connected and ready to use.
              </p>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleDisconnect}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Disconnect
                </button>
                <button
                  onClick={() => (window.location.href = '/linkedin')}
                  className="bg-brand-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Start Posting
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
