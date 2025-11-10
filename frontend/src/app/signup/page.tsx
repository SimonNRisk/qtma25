'use client';

import { useState, useEffect, Suspense } from 'react';
import { postJSON } from '@/lib/api';
import { session } from '@/lib/session';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { syncOnboardingDataAfterSignup } from '@/lib/onboarding';
import { StepCard } from '../onboarding/components/StepCard';

function SignUpForm() {
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

  // Check if user has completed onboarding before allowing signup
  useEffect(() => {
    const onboardingData = localStorage.getItem('onboarding_data');

    // If no onboarding data exists, redirect to onboarding (no signup without onboarding)
    if (!onboardingData) {
      router.replace('/onboarding');
    }
  }, [router]);

  async function handleOAuthLogin(provider: string) {
    setOauthLoading(provider);
    setMsg(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/oauth/${provider}`);
      const data = await response.json();

      if (data.url) {
        // Redirect to OAuth provider
        window.location.href = data.url;
      } else {
        setMsg('OAuth login failed. Please try again.');
      }
    } catch {
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
      // ⬇️ include first_name & last_name
      const signupResponse = await postJSON('/auth/signup', {
        email,
        password,
        first_name: first,
        last_name: last,
      });

      // Check if email confirmation is required
      if (signupResponse.email_confirmation_required) {
        // Show success message about email confirmation
        setMsg(
          'Account created successfully! Please check your email to confirm your account before signing in.'
        );

        // Clear form
        setEmail('');
        setPassword('');
        setFirst('');
        setLast('');

        // Start countdown and redirect to login page
        setCountdown(5);
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              // Use setTimeout to avoid setState during render
              const redirectTo = searchParams.get('redirect');
              const loginUrl = redirectTo
                ? `/login?redirect=${encodeURIComponent(redirectTo)}`
                : '/login';
              setTimeout(() => router.push(loginUrl), 0);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        // Email confirmation not required - automatically log in
        try {
          const loginResponse = await postJSON('/auth/login', {
            email,
            password,
          });

          // Save JWT tokens
          session.save(loginResponse.access_token, loginResponse.refresh_token);

          // Sync onboarding data if it exists
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

          // Redirect to profile page
          setTimeout(() => {
            router.push('/me');
          }, 1500);
        } catch (loginError) {
          console.error('Auto-login failed:', loginError);
          setMsg('Account created! Please log in manually.');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setMsg(errorMessage.replace(/["{}]/g, '') || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--login-bg-start)] via-[var(--login-bg-mid)] to-[var(--login-bg-end)] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <StepCard>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-white/80">Join us today and get started</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="first"
                  className="block text-[13px] font-semibold uppercase tracking-wide text-white/80 mb-1"
                >
                  First Name
                </label>
                <input
                  id="first"
                  placeholder="Enter first name"
                  value={first}
                  onChange={e => setFirst(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/60 bg-transparent px-4 py-3 text-sm text-white placeholder-white/70 shadow-inner shadow-black/20 outline-none transition focus:border-white focus:ring-2 focus:ring-white/30"
                />
              </div>
              <div>
                <label
                  htmlFor="last"
                  className="block text-[13px] font-semibold uppercase tracking-wide text-white/80 mb-1"
                >
                  Last Name
                </label>
                <input
                  id="last"
                  placeholder="Enter last name"
                  value={last}
                  onChange={e => setLast(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/60 bg-transparent px-4 py-3 text-sm text-white placeholder-white/70 shadow-inner shadow-black/20 outline-none transition focus:border-white focus:ring-2 focus:ring-white/30"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-[13px] font-semibold uppercase tracking-wide text-white/80 mb-1"
              >
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
                className="w-full rounded-xl border border-white/60 bg-transparent px-4 py-3 text-sm text-white placeholder-white/70 shadow-inner shadow-black/20 outline-none transition focus:border-white focus:ring-2 focus:ring-white/30"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[13px] font-semibold uppercase tracking-wide text-white/80 mb-1"
              >
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
                className="w-full rounded-xl border border-white/60 bg-transparent px-4 py-3 text-sm text-white placeholder-white/70 shadow-inner shadow-black/20 outline-none transition focus:border-white focus:ring-2 focus:ring-white/30"
              />
              <p className="mt-1 text-[11px] text-white/75">
                Use 8 or more letters, numbers, and symbols
              </p>
            </div>

            {msg && (
              <div
                className={`px-4 py-3 rounded-xl border ${
                  msg.includes('successfully')
                    ? 'bg-green-500/10 border-green-400/40 text-green-100'
                    : 'bg-red-500/10 border-red-400/40 text-red-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{msg}</span>
                  {countdown > 0 && (
                    <span className="text-xs font-semibold">Redirecting in {countdown}s...</span>
                  )}
                </div>
              </div>
            )}

            <div className="relative mt-8">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent blur-xl opacity-30 pointer-events-none" />
              <button
                type="submit"
                disabled={loading}
                className="relative w-full rounded-2xl py-3.5 text-base font-semibold tracking-wide text-white transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50 border border-[var(--login-button-border)] bg-gradient-to-br from-[var(--login-button-start)] via-[var(--login-button-mid)] to-[var(--login-button-end)] login-button"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          {/* OAuth Section */}
          <div className="mt-6">
            <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
              <div className="flex-1 border-t border-white/40" />
              <span>OR</span>
              <div className="flex-1 border-t border-white/40" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              {/* Google OAuth */}
              <button
                onClick={() => handleOAuthLogin('google')}
                disabled={oauthLoading === 'google'}
                className="w-full inline-flex justify-center rounded-xl border border-white/60 bg-transparent px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {oauthLoading === 'google' ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Image
                      src="/google-logo.svg"
                      alt="Google logo"
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                    Continue with Google
                  </>
                )}
              </button>

              {/* GitHub OAuth */}
              <button
                onClick={() => handleOAuthLogin('github')}
                disabled={oauthLoading === 'github'}
                className="w-full inline-flex justify-center rounded-xl border border-white/60 bg-transparent px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {oauthLoading === 'github' ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Image
                      src="/github-logo.svg"
                      alt="GitHub logo"
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                    Continue with GitHub
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/80">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-white font-semibold hover:text-cyan-200 transition duration-200"
              >
                Sign in
              </Link>
            </p>
          </div>
        </StepCard>
      </div>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[var(--login-bg-start)] via-[var(--login-bg-mid)] to-[var(--login-bg-end)] flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/80">Loading...</p>
          </div>
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
