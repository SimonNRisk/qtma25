'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { API_URL } from '@/lib/api';
import { FaLinkedin, FaCheck } from 'react-icons/fa';

function LinkedInCallbackContent() {
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
      fetch(`${API_URL}/api/linkedin/callback`, {
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
      <div className="min-h-screen px-8 py-10 sm:px-10 lg:px-12 flex items-center justify-center bg-astro-hero">
        <div className="max-w-2xl mx-auto w-full">
          <div className="bg-astro-panel-dark/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center animate-[fade-in_0.6s_ease-out]">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border ${
                isSuccess ? 'bg-green-500/20 border-green-500/40' : 'bg-white/10 border-white/20'
              }`}
            >
              {isSuccess ? (
                <FaCheck className="w-10 h-10 text-green-400" />
              ) : (
                <FaLinkedin className="w-10 h-10 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-medium text-white mb-4">LinkedIn Authentication</h1>
            <p className="text-white/70 mb-4 leading-relaxed">{status}</p>
            {isSuccess && <p className="text-sm text-white/60">Redirecting you back...</p>}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

export default function LinkedInCallback() {
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
      <LinkedInCallbackContent />
    </Suspense>
  );
}
