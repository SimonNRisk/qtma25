'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';

export default function LinkedInCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing...');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus(`OAuth Error: ${error}`);
      return;
    }

    if (code) {
      // Send code to backend to exchange for access token
      fetch('http://localhost:8000/api/linkedin/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.message) {
            setStatus('Successfully connected to LinkedIn!');
            setIsSuccess(true);
            // Redirect back to profile page after 2 seconds
            setTimeout(() => {
              router.push('/me');
            }, 2000);
          } else {
            setStatus(`Error: ${data.detail || 'Authentication failed'}`);
          }
        })
        .catch(error => {
          setStatus(`Network error: ${error}`);
        });
    } else {
      setStatus('No authorization code received');
    }
  }, [searchParams, router]);

  return (
    <AuthGuard>
      <main className="min-h-screen bg-brand-light flex items-center justify-center p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isSuccess ? 'bg-green-500' : 'bg-brand-blue'
              }`}
            >
              {isSuccess ? (
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
              ) : (
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.064-2.064 2.064zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              )}
            </div>
            <h1 className="text-2xl font-bold text-brand-dark mb-2">LinkedIn Authentication</h1>
            <p className="text-gray-600 mb-4">{status}</p>
            {isSuccess && <p className="text-sm text-gray-500">Redirecting you back...</p>}
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
