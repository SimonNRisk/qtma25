'use client';
import { useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { API_URL } from '@/lib/api';

export default function LinkedInConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');

    try {
      // Get OAuth URL from backend with authentication (cookies sent automatically)
      const response = await fetch(`${API_URL}/api/linkedin/auth`, {
        credentials: 'include', // Include cookies
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
      <div className="min-h-screen px-8 py-10 sm:px-10 lg:px-12 bg-astro-hero">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-medium text-white mb-2">Connect LinkedIn</h1>
            <p className="text-white/60 text-sm">
              Connect your LinkedIn account to start posting content
            </p>
          </div>

          <div className="border-b border-white/20 mb-8"></div>

          {!isConnected ? (
            <div className="bg-astro-panel-dark/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 animate-[fade-in_0.6s_ease-out]">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.064-2.064 2.064zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-medium text-white mb-4">
                  Connect Your LinkedIn Account
                </h2>
                <p className="text-white/70 mb-8 leading-relaxed">
                  Authorize our app to post content on your behalf. We&apos;ll only post what you
                  create.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full py-4 rounded-xl text-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 bg-astro-sky text-astro-panel-dark"
              >
                {isConnecting ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></span>
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.064-2.064 2.064zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    Connect to LinkedIn
                  </>
                )}
              </button>

              <div className="mt-8 space-y-2 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <span className="text-white/40">•</span>
                  <p>We&apos;ll redirect you to LinkedIn to authorize</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/40">•</span>
                  <p>You can revoke access anytime in LinkedIn settings</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/40">•</span>
                  <p>We only request permission to post content</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-astro-panel-dark/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center animate-[fade-in_0.6s_ease-out]">
              <div className="w-20 h-20 bg-green-500/20 border border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-green-400"
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
              <h2 className="text-2xl font-medium text-white mb-4">Successfully Connected!</h2>
              <p className="text-white/70 mb-8 leading-relaxed">
                Your LinkedIn account is now connected and ready to use.
              </p>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleDisconnect}
                  className="px-6 py-3 border border-white/30 text-white/80 rounded-xl font-medium hover:bg-white/10 hover:text-white transition-colors"
                >
                  Disconnect
                </button>
                <button
                  onClick={() => (window.location.href = '/create')}
                  className="px-6 py-3 rounded-xl font-medium transition-colors hover:opacity-90 bg-astro-sky text-astro-panel-dark"
                >
                  Start Posting
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
