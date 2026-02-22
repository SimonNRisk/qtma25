'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { postJSON } from '@/lib/api';

type ResetCredentials = {
  accessToken?: string;
  refreshToken?: string;
  tokenHash?: string;
  tokenType?: string;
};

type ParsedResetState = {
  credentials: ResetCredentials | null;
  errorMessage: string | null;
};

function getErrorMessage(error: unknown): string {
  const fallback = 'Unable to reset password. Please request a new link and try again.';
  if (!(error instanceof Error)) {
    return fallback;
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
    // If this is not JSON, continue and use raw message.
  }

  return error.message || fallback;
}

function parseResetState(searchParams: { get: (key: string) => string | null }): ParsedResetState {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const mergedCredentials: ResetCredentials = {
    tokenHash: searchParams.get('token_hash') || hashParams.get('token_hash') || undefined,
    tokenType: searchParams.get('type') || hashParams.get('type') || 'recovery',
    accessToken: searchParams.get('access_token') || hashParams.get('access_token') || undefined,
    refreshToken:
      searchParams.get('refresh_token') || hashParams.get('refresh_token') || undefined,
  };

  const errorDescription =
    searchParams.get('error_description') ||
    hashParams.get('error_description') ||
    searchParams.get('error') ||
    hashParams.get('error');

  if (errorDescription) {
    return {
      credentials: null,
      errorMessage: errorDescription,
    };
  }

  const hasTokenHash = Boolean(mergedCredentials.tokenHash);
  const hasTokenPair = Boolean(mergedCredentials.accessToken && mergedCredentials.refreshToken);

  if (!hasTokenHash && !hasTokenPair) {
    return {
      credentials: null,
      errorMessage: 'Invalid or expired reset link. Please request a new one.',
    };
  }

  return {
    credentials: mergedCredentials,
    errorMessage: null,
  };
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [credentials, setCredentials] = useState<ResetCredentials | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const parsed = parseResetState(searchParams);
    setCredentials(parsed.credentials);
    setLinkError(parsed.errorMessage);
    setReady(true);
  }, [searchParams]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError(null);

    if (!credentials) {
      setApiError('Invalid or expired reset link. Please request a new one.');
      return;
    }

    if (newPassword.length < 8) {
      setApiError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setApiError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = {
        new_password: newPassword,
      };

      if (credentials.tokenHash) {
        payload.token_hash = credentials.tokenHash;
        payload.type = credentials.tokenType || 'recovery';
      } else if (credentials.accessToken && credentials.refreshToken) {
        payload.access_token = credentials.accessToken;
        payload.refresh_token = credentials.refreshToken;
      }

      await postJSON('/auth/reset-password/confirm', payload);
      window.location.href = '/me';
    } catch (submitError) {
      setApiError(getErrorMessage(submitError));
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="h-screen overflow-hidden flex items-center justify-center p-6 bg-gradient-to-br from-[var(--login-bg-start)] via-[var(--login-bg-mid)] to-[var(--login-bg-end)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (linkError || !credentials) {
    return (
      <main className="h-screen overflow-hidden flex items-center justify-center p-6 bg-gradient-to-br from-[var(--login-bg-start)] via-[var(--login-bg-mid)] to-[var(--login-bg-end)]">
        <div className="max-w-xl w-full">
          <div className="rounded-[32px] border border-white/60 px-10 py-8 text-white shadow-[0_30px_60px_rgba(0,0,0,0.55)] bg-gradient-to-b from-[var(--login-card-start)] via-[var(--login-card-mid)] to-[var(--login-card-end)] text-center">
            <h1 className="mt-3 text-3xl font-light tracking-[0.2em] uppercase">Invalid Link</h1>
            <p className="mt-4 text-sm text-red-100 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3">
              {linkError || 'Invalid or expired reset link. Please request a new one.'}
            </p>
            <div className="mt-6 space-y-2 text-sm text-white/80">
              <p>
                <Link
                  href="/forgot-password"
                  className="text-white font-semibold hover:text-cyan-200 transition duration-200"
                >
                  Request a new reset link
                </Link>
              </p>
              <p>
                <Link
                  href="/login"
                  className="text-white font-semibold hover:text-cyan-200 transition duration-200"
                >
                  Back to login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden flex items-center justify-center p-6 bg-gradient-to-br from-[var(--login-bg-start)] via-[var(--login-bg-mid)] to-[var(--login-bg-end)]">
      <div className="max-w-xl w-full">
        <div className="rounded-[32px] border border-white/60 px-10 py-8 text-white shadow-[0_30px_60px_rgba(0,0,0,0.55)] bg-gradient-to-b from-[var(--login-card-start)] via-[var(--login-card-mid)] to-[var(--login-card-end)]">
          <div className="text-center mb-8">
            <h1 className="mt-3 text-3xl font-light tracking-[0.2em] uppercase">Set New Password</h1>
            <p className="mt-3 text-sm text-white/80">
              Choose a new password with at least 8 characters.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="new-password"
                className="block text-[13px] font-semibold uppercase tracking-wide text-white/80 mb-1"
              >
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={event => setNewPassword(event.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                required
                className="w-full rounded-xl border border-white/60 bg-transparent px-4 py-3 text-sm text-white placeholder-white/70 shadow-inner shadow-black/20 outline-none transition focus:border-white focus:ring-2 focus:ring-white/30"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-[13px] font-semibold uppercase tracking-wide text-white/80 mb-1"
              >
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
                required
                className="w-full rounded-xl border border-white/60 bg-transparent px-4 py-3 text-sm text-white placeholder-white/70 shadow-inner shadow-black/20 outline-none transition focus:border-white focus:ring-2 focus:ring-white/30"
              />
            </div>

            {apiError && (
              <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-3 text-sm text-red-100">
                {apiError}
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent blur-xl opacity-30 pointer-events-none" />
              <button
                type="submit"
                disabled={loading}
                className="relative w-full rounded-2xl py-3.5 text-base font-semibold tracking-wide text-white transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70 border border-[var(--login-button-border)] bg-gradient-to-br from-[var(--login-button-start)] via-[var(--login-button-mid)] to-[var(--login-button-end)] login-button"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen overflow-hidden flex items-center justify-center p-6 bg-gradient-to-br from-[var(--login-bg-start)] via-[var(--login-bg-mid)] to-[var(--login-bg-end)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
