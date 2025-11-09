'use client';

import { useState, useEffect } from 'react';
import { postJSON } from '@/lib/api';
import { session } from '@/lib/session';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
      const data = await postJSON('/auth/login', { email, password });
      session.save(data.access_token, data.refresh_token);

      const f = sessionStorage.getItem('pending_first_name');
      const l = sessionStorage.getItem('pending_last_name');
      if (f || l) {
        sessionStorage.removeItem('pending_first_name');
        sessionStorage.removeItem('pending_last_name');
      }

      const redirectTo = searchParams.get('redirect') || '/me';
      router.push(redirectTo);
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      if (errorMessage.includes('email') && errorMessage.includes('confirm')) {
        setMsg('Please check your email and confirm your account before signing in.');
      } else {
        setMsg(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session.access()) router.replace('/me');
  }, [router]);

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center p-6 bg-gradient-to-br from-[var(--login-bg-start)] via-[var(--login-bg-mid)] to-[var(--login-bg-end)]">
      <div className="max-w-xl w-full">
        <div className="rounded-[32px] border border-white/60 px-10 py-6 text-white shadow-[0_30px_60px_rgba(0,0,0,0.55)] bg-gradient-to-b from-[var(--login-card-start)] via-[var(--login-card-mid)] to-[var(--login-card-end)]">
          <div className="text-center mb-8">
            <h1 className="mt-3 text-3xl font-light tracking-[0.4em] uppercase">Welcome Back</h1>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-[13px] font-semibold uppercase tracking-wide text-white/80 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
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
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-white/60 bg-transparent px-4 py-3 text-sm text-white placeholder-white/70 shadow-inner shadow-black/20 outline-none transition focus:border-white focus:ring-2 focus:ring-white/30"
              />
              <p className="mt-1 text-[11px] text-white/75">
                Use 8 or more letters, numbers, and symbols
              </p>
            </div>

            {msg && (
              <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                {msg}
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent blur-xl opacity-30 pointer-events-none" />
              <button
                type="submit"
                disabled={loading}
                className="relative w-full rounded-2xl py-3.5 text-base font-semibold tracking-wide text-white transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70 border border-[var(--login-button-border)] bg-gradient-to-br from-[var(--login-button-start)] via-[var(--login-button-mid)] to-[var(--login-button-end)] login-button"
              >
                {loading ? 'Signing in...' : 'Continue'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
              <div className="flex-1 border-t border-white/40" />
              <span>OR</span>
              <div className="flex-1 border-t border-white/40" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <button
                onClick={() => handleOAuthLogin('google')}
                disabled={oauthLoading === 'google'}
                className="w-full inline-flex justify-center rounded-xl border border-white/60 bg-transparent px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {oauthLoading === 'google' ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              <button
                onClick={() => handleOAuthLogin('github')}
                disabled={oauthLoading === 'github'}
                className="w-full inline-flex justify-center rounded-xl border border-white/60 bg-transparent px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {oauthLoading === 'github' ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Continue with GitHub
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/80">
              Don't have an account?{' '}
              <Link
                href="/onboarding"
                className="text-white font-semibold hover:text-cyan-200 transition duration-200"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
