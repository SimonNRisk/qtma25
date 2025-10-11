'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { session } from '@/lib/session';
import { API_URL } from '@/lib/api';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

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
              setTimeout(() => {
                router.push('/me');
              }, 2000);
            } else {
              const errorText = await response.text();
              console.error('Backend error:', errorText);
              throw new Error(`Failed to exchange code: ${errorText}`);
            }
          } catch (exchangeError) {
            console.error('OAuth code exchange error:', exchangeError);
            setStatus('error');
            setMessage(`OAuth error: ${exchangeError.message}`);
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

              // Redirect to profile page after a short delay
              setTimeout(() => {
                router.push('/me');
              }, 2000);
            } else {
              const errorText = await response.text();
              console.error('Backend error:', errorText);
              throw new Error(`Failed to exchange tokens: ${errorText}`);
            }
          } catch (exchangeError) {
            console.error('OAuth exchange error:', exchangeError);
            setStatus('error');
            setMessage(`OAuth error: ${exchangeError.message}`);
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
      } catch (err) {
        setStatus('error');
        setMessage('An error occurred during authentication');
      }
    };

    handleAuthCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-6"></div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirming Email...</h1>
              <p className="text-gray-600">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-green-600"
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                Redirecting to your profile...
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirmation Failed</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                >
                  Go to Login
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
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
