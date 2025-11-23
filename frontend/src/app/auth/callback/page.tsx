'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { session } from '@/lib/session';
import { API_URL } from '@/lib/api';
import { shouldRedirectToLocalhost, getLocalhostUrl } from '@/lib/env';
import { getOnboardingData } from '@/lib/onboarding';
import Image from 'next/image';
import { HiCheck, HiXMark } from 'react-icons/hi2';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  // Check if we're on the wrong domain (production when we should be on localhost)
  useEffect(() => {
    if (shouldRedirectToLocalhost()) {
      window.location.href = getLocalhostUrl();
      return;
    }
  }, []);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the authorization code from URL parameters
        const code = searchParams.get('code');
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        console.log('OAuth callback params:', {
          code: !!code,
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          error,
          errorDescription,
        });

        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Authentication failed');
          return;
        }

        // Handle OAuth code flow (GitHub/Google)
        if (code) {
          try {
            const response = await fetch(`${API_URL}/auth/oauth/callback`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                code: code,
              }),
            });

            if (response.ok) {
              const data = await response.json();

              // Check if we have the required tokens
              if (!data.access_token) {
                throw new Error('No access token received from backend');
              }

              // Save our JWT tokens to localStorage
              session.save(data.access_token, data.refresh_token);

              setStatus('success');
              setMessage('Successfully logged in! Welcome to your account.');

              // Redirect to profile page after a short delay
              setTimeout(async () => {
                const onboardingData = await getOnboardingData();
                const redirectPath = onboardingData ? '/me' : '/onboarding';
                if (shouldRedirectToLocalhost()) {
                  window.location.href = `http://localhost:3000${redirectPath}`;
                } else {
                  router.push(redirectPath);
                }
              }, 2000);
            } else {
              const errorText = await response.text();
              console.error('Backend error:', errorText);
              throw new Error(`Failed to exchange code: ${errorText}`);
            }
          } catch (exchangeError) {
            console.error('OAuth code exchange error:', exchangeError);
            setStatus('error');
            const errorMessage =
              exchangeError instanceof Error ? exchangeError.message : 'OAuth exchange failed';
            setMessage(`OAuth error: ${errorMessage}`);
          }
        }
        // Handle direct token flow (if tokens are provided directly)
        else if (accessToken && refreshToken) {
          // For OAuth, we need to exchange the Supabase tokens for our JWT tokens
          try {
            console.log('Calling backend OAuth callback...');
            const response = await fetch(`${API_URL}/auth/oauth/callback`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                access_token: accessToken,
                refresh_token: refreshToken,
              }),
            });

            console.log('Backend response status:', response.status);

            if (response.ok) {
              const data = await response.json();
              console.log('Backend response data:', data);
              // Save our JWT tokens to localStorage
              session.save(data.access_token, data.refresh_token);
              setStatus('success');
              setMessage('Successfully logged in! Welcome to your account.');

              // Check if user has completed onboarding
              setTimeout(async () => {
                const onboardingData = await getOnboardingData();
                const redirectPath = onboardingData ? '/me' : '/onboarding';

                if (shouldRedirectToLocalhost()) {
                  window.location.href = `http://localhost:3000${redirectPath}`;
                } else {
                  router.push(redirectPath);
                }
              }, 2000);
            } else {
              const errorText = await response.text();
              console.error('Backend error:', errorText);
              throw new Error(`Failed to exchange tokens: ${errorText}`);
            }
          } catch (exchangeError) {
            console.error('OAuth exchange error:', exchangeError);
            setStatus('error');
            const errorMessage =
              exchangeError instanceof Error ? exchangeError.message : 'OAuth exchange failed';
            setMessage(`OAuth error: ${errorMessage}`);
          }
        } else {
          console.log(
            'Missing tokens - accessToken:',
            !!accessToken,
            'refreshToken:',
            !!refreshToken
          );
          setStatus('error');
          setMessage('Invalid authentication link - missing tokens');
        }
      } catch {
        setStatus('error');
        setMessage('An error occurred during authentication');
      }
    };

    handleAuthCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--login-bg-start)] via-[var(--login-bg-mid)] to-[var(--login-bg-end)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="rounded-[32px] border border-white/60 px-10 py-12 text-white shadow-[0_30px_60px_rgba(0,0,0,0.55)] bg-gradient-to-b from-[var(--login-card-start)] via-[var(--login-card-mid)] to-[var(--login-card-end)] text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Image
              src="/astro-white.png"
              alt="Astro"
              width={120}
              height={58}
              className="opacity-90"
            />
          </div>

          {status === 'loading' && (
            <>
              <div className="relative mb-8">
                <div className="animate-spin rounded-full h-20 w-20 border-[3px] border-white/30 border-t-white mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">Almost there!</h1>
              <p className="text-white/80 text-lg mb-2">Securing your connection...</p>
              <p className="text-white/60 text-sm">Just a moment while we verify everything ✨</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="relative mb-8">
                <div className="w-24 h-24 mx-auto">
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                  <div className="relative w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/40">
                    <HiCheck className="w-12 h-12 text-white animate-[scale-in_0.5s_ease-out]" />
                  </div>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3 animate-[fade-in_0.6s_ease-out]">
                Welcome aboard! 🚀
              </h1>
              <p className="text-white/80 text-lg mb-6">{message}</p>
              <div className="bg-white/10 backdrop-blur-sm border border-white/30 text-white px-6 py-4 rounded-xl">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">Taking you to your dashboard...</span>
                </div>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-8">
                <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center border-2 border-white/30">
                  <HiXMark className="w-10 h-10 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">Oops! Something went wrong</h1>
              <p className="text-white/80 text-lg mb-8">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:text-white"
                >
                  Back to Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[var(--login-bg-start)] via-[var(--login-bg-mid)] to-[var(--login-bg-end)] flex items-center justify-center p-4">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-[3px] border-white/30 border-t-white mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="text-white/80">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
