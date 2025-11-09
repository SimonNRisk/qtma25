'use client';

import { useState } from 'react';
import { postJSON } from '@/lib/api';
import { session } from '@/lib/session';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { syncOnboardingDataAfterSignup } from '@/lib/onboarding';

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  async function handleOAuthLogin(provider: string) {
    setOauthLoading(provider);
    setMsg(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/oauth/${provider}`);
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setMsg('OAuth login failed. Please try again.');
      }
    } catch (err: any) {
      setMsg('OAuth login failed. Please try again.');
    } finally {
      setOauthLoading(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const signupResponse = await postJSON('/auth/signup', {
        email,
        password,
        first_name: first,
        last_name: last,
      });

      if (signupResponse.email_confirmation_required) {
        setMsg('Account created successfully! Please check your email to confirm your account before signing in.');
        setEmail('');
        setPassword('');
        setFirst('');
        setLast('');

        setCountdown(5);
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              const redirectTo = searchParams.get('redirect');
              const loginUrl = redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login';
              setTimeout(() => router.push(loginUrl), 0);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        try {
          const loginResponse = await postJSON('/auth/login', {
            email,
            password,
          });

          session.save(loginResponse.access_token, loginResponse.refresh_token);

          try {
            const synced = await syncOnboardingDataAfterSignup();
            if (synced) {
              console.log('Onboarding data synced successfully');
            } else {
              console.log('No onboarding data to sync');
            }
          } catch (error) {
            console.warn('Failed to sync onboarding data:', error);
          }

          setMsg('Account created and logged in successfully!');
          setTimeout(() => {
            router.push('/me');
          }, 1500);
        } catch (loginError: any) {
          console.error('Auto-login failed:', loginError);
          setMsg('Account created! Please log in manually.');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
      }
    } catch (err: any) {
      setMsg(err.message?.replace(/["{}]/g, '') || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="signup-shell">
      <div className="signup-card text-gray-800">
        <div className="text-center mb-8">
          <h1 className="text-[32px] font-semibold text-white">Welcome to Astro</h1>
          <p className="text-sm text-gray-200 mt-1">Begin by creating an account</p>
        </div>

        <form onSubmit={onSubmit} className="signup-form">
          <div className="signup-field-grid">
            <div>
              <label htmlFor="first" className="block text-sm font-semibold text-gray-700 mb-1">
                First Name
              </label>
              <input
                id="first"
                placeholder="Enter first name"
                value={first}
                onChange={e => setFirst(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-[14px] bg-white text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-150 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label htmlFor="last" className="block text-sm font-semibold text-gray-700 mb-1">
                Last Name
              </label>
              <input
                id="last"
                placeholder="Enter last name"
                value={last}
                onChange={e => setLast(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-[14px] bg-white text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-150 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-200 rounded-[14px] bg-white text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-150 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 border border-gray-200 rounded-[14px] bg-white text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-150 placeholder:text-gray-400"
            />
          </div>

          {msg && (
            <div
              className={`px-3 py-2.5 rounded-lg ${
                msg.includes('successfully')
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              <div className="flex items-center justify-between text-sm">
                <span>{msg}</span>
                {countdown > 0 && (
                  <span className="font-semibold whitespace-nowrap">Redirecting in {countdown}s...</span>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8a2be2] hover:bg-[#7a24c8] disabled:bg-purple-300 text-white font-semibold py-3 px-4 rounded-[16px] transition duration-150 shadow-[0_15px_30px_rgba(138,43,226,0.35)] hover:shadow-[0_18px_38px_rgba(122,36,200,0.45)] disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="signup-divider">OR</div>

        <div className="mt-4 grid grid-cols-1 gap-2.5">
          <button
            onClick={() => handleOAuthLogin('google')}
            disabled={oauthLoading === 'google'}
            className="w-full inline-flex justify-center py-3 px-4 border border-gray-200 rounded-[16px] shadow-[0_10px_20px_rgba(15,15,40,0.08)] bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
          >
            {oauthLoading === 'google' ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500" />
            ) : (
              <>
                <Image src="/google-logo.svg" alt="Google logo" width={20} height={20} className="mr-2" />
                Continue with Google
              </>
            )}
          </button>
        </div>

        <div className="signup-footer">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="signup-footer__primary">
              Log in here
            </Link>
          </p>
          <Link href="/" className="signup-footer__home">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
