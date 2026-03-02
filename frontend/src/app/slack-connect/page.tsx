'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { FaSlack } from 'react-icons/fa';
import { getSlackAuthUrl } from '@/lib/slack';

export default function SlackConnect() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');

    try {
      const { auth_url } = await getSlackAuthUrl();
      // Redirect to Slack OAuth
      window.location.href = auth_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Slack');
      setIsConnecting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen px-8 py-10 sm:px-10 lg:px-12 bg-astro-hero">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/explore')}
              className="text-white/60 hover:text-white text-sm mb-4 flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Explore
            </button>
            <h1 className="text-4xl font-medium text-white mb-2">Connect Slack</h1>
            <p className="text-white/60 text-sm">
              Connect your Slack workspace to generate LinkedIn content from internal communications
            </p>
          </div>

          <div className="border-b border-white/20 mb-8"></div>

          <div className="bg-astro-panel-dark/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 animate-[fade-in_0.6s_ease-out]">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                <FaSlack className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-medium text-white mb-4">
                Connect Your Slack Workspace
              </h2>
              <p className="text-white/70 mb-8 leading-relaxed">
                Astro will analyze messages in channels you select to generate LinkedIn post ideas
                from your team&apos;s internal communications.
              </p>
            </div>

            {/* Legal Disclaimer */}
            {showDisclaimer && (
              <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
                <h3 className="text-white font-medium mb-2">Data Usage & Privacy</h3>
                <ul className="text-white/60 text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-white/40 mt-1">•</span>
                    <span>Astro only monitors channels you explicitly enable</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/40 mt-1">•</span>
                    <span>Full message content is not stored, only generated hooks and summaries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/40 mt-1">•</span>
                    <span>You can disconnect at any time and all data will be deleted</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/40 mt-1">•</span>
                    <span>We use read-only access and cannot post to your Slack</span>
                  </li>
                </ul>
                <label className="flex items-center gap-3 mt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!showDisclaimer}
                    onChange={() => setShowDisclaimer(false)}
                    className="w-4 h-4 rounded border-white/30 bg-white/10 text-astro-sky focus:ring-astro-sky focus:ring-offset-0"
                  />
                  <span className="text-white/80 text-sm">
                    I understand and agree to these terms
                  </span>
                </label>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={isConnecting || showDisclaimer}
              className="w-full py-4 rounded-xl text-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 bg-astro-sky text-astro-panel-dark"
            >
              {isConnecting ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></span>
                  Connecting...
                </>
              ) : (
                <>
                  <FaSlack className="w-5 h-5" />
                  Connect to Slack
                </>
              )}
            </button>

            <div className="mt-8 space-y-2 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <span className="text-white/40">•</span>
                <p>You&apos;ll be redirected to Slack to authorize the connection</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40">•</span>
                <p>After connecting, select which channels to monitor</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40">•</span>
                <p>Generated hooks will appear in the Integrations tab</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
