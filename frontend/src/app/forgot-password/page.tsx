'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { postJSON } from '@/lib/api';

const GENERIC_SUCCESS_MESSAGE = 'If an account exists, a reset link has been sent.';

function getErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Unable to send reset email. Please try again.';
  }

  try {
    const parsed = JSON.parse(error.message);
    if (typeof parsed?.detail === 'string') {
      return parsed.detail;
    }
    if (Array.isArray(parsed?.detail) && parsed.detail.length > 0) {
      const firstError = parsed.detail[0];
      if (typeof firstError?.msg === 'string') {
        return firstError.msg;
      }
    }
  } catch {
    // If the payload is not JSON, fall back to the raw message.
  }

  return error.message || 'Unable to send reset email. Please try again.';
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const response = await postJSON('/auth/forgot-password', { email });
      setSuccessMessage(response?.message || GENERIC_SUCCESS_MESSAGE);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="h-screen overflow-hidden flex items-center justify-center p-6 bg-gradient-to-br from-[var(--login-bg-start)] via-[var(--login-bg-mid)] to-[var(--login-bg-end)]">
      <div className="max-w-xl w-full">
        <div className="rounded-[32px] border border-white/60 px-10 py-8 text-white shadow-[0_30px_60px_rgba(0,0,0,0.55)] bg-gradient-to-b from-[var(--login-card-start)] via-[var(--login-card-mid)] to-[var(--login-card-end)]">
          <div className="text-center mb-8">
            <h1 className="mt-3 text-3xl font-light tracking-[0.2em] uppercase">Reset Password</h1>
            <p className="mt-3 text-sm text-white/80">
              Enter your email and we&apos;ll send a secure reset link.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
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
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-white/60 bg-transparent px-4 py-3 text-sm text-white placeholder-white/70 shadow-inner shadow-black/20 outline-none transition focus:border-white focus:ring-2 focus:ring-white/30"
              />
            </div>

            {successMessage && (
              <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-100">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent blur-xl opacity-30 pointer-events-none" />
              <button
                type="submit"
                disabled={loading}
                className="relative w-full rounded-2xl py-3.5 text-base font-semibold tracking-wide text-white transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70 border border-[var(--login-button-border)] bg-gradient-to-br from-[var(--login-button-start)] via-[var(--login-button-mid)] to-[var(--login-button-end)] login-button"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-white/80">
              Remember your password?{' '}
              <Link href="/login" className="text-white font-semibold hover:text-cyan-200 transition duration-200">
                Back to login
              </Link>
            </p>
            <p className="text-sm text-white/80">
              Need an account?{' '}
              <Link href="/signup" className="text-white font-semibold hover:text-cyan-200 transition duration-200">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
