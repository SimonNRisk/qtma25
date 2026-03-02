'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { FaSlack, FaCheck } from 'react-icons/fa';
import { completeSlackOAuth } from '@/lib/slack';

function SlackCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing...');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus(`OAuth Error: ${error}`);
      setIsError(true);
      return;
    }

    if (!code || !state) {
      setStatus('Missing authorization code or state');
      setIsError(true);
      return;
    }

    // Exchange code for token
    completeSlackOAuth(code, state)
      .then(data => {
        if (data.success && data.workspace) {
          setStatus(`Successfully connected to ${data.workspace.team_name}!`);
          setIsSuccess(true);
          // Redirect to explore/integrations after 2 seconds
          setTimeout(() => {
            router.push('/explore?tab=integrations');
          }, 2000);
        } else {
          setStatus('Failed to connect workspace');
          setIsError(true);
        }
      })
      .catch(err => {
        setStatus(err instanceof Error ? err.message : 'Authentication failed');
        setIsError(true);
      });
  }, [searchParams, router]);

  return (
    <AuthGuard>
      <div className="min-h-screen px-8 py-10 sm:px-10 lg:px-12 flex items-center justify-center bg-astro-hero">
        <div className="max-w-2xl mx-auto w-full">
          <div className="bg-astro-panel-dark/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center animate-[fade-in_0.6s_ease-out]">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border ${
                isSuccess
                  ? 'bg-green-500/20 border-green-500/40'
                  : isError
                    ? 'bg-red-500/20 border-red-500/40'
                    : 'bg-white/10 border-white/20'
              }`}
            >
              {isSuccess ? (
                <FaCheck className="w-10 h-10 text-green-400" />
              ) : isError ? (
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <FaSlack className="w-10 h-10 text-white animate-pulse" />
              )}
            </div>

            <h1 className="text-2xl font-medium text-white mb-4">Slack Connection</h1>
            <p className={`mb-4 leading-relaxed ${isError ? 'text-red-300' : 'text-white/70'}`}>
              {status}
            </p>

            {isSuccess && (
              <p className="text-sm text-white/60">Redirecting to Integrations...</p>
            )}

            {isError && (
              <button
                onClick={() => router.push('/slack-connect')}
                className="mt-4 px-6 py-3 rounded-xl font-medium transition-colors bg-astro-sky text-astro-panel-dark hover:opacity-90"
              >
                Try Again
              </button>
            )}

            {!isSuccess && !isError && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white/40"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

export default function SlackCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen px-8 py-10 sm:px-10 lg:px-12 flex items-center justify-center bg-astro-hero">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white/40 mx-auto mb-4"></div>
            <p className="text-white/70">Loading...</p>
          </div>
        </div>
      }
    >
      <SlackCallbackContent />
    </Suspense>
  );
}
