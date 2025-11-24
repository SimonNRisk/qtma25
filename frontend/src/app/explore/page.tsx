'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { useGetIndustry } from './hooks/useGetIndustry';
import { useGetNewsHooks } from './hooks/useGetNewsHooks';

const formatMetaDate = (value?: string | null) => {
  if (!value) return 'Fresh off the press';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Fresh off the press';
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function ExplorePage() {
  const router = useRouter();
  const { industry, loading: industryLoading } = useGetIndustry();
  const {
    newsHooks,
    loading: newsHooksLoading,
    error: newsHooksError,
  } = useGetNewsHooks(industry || undefined);

  const isLoading = industryLoading || newsHooksLoading;
  const errorMessage = newsHooksError;

  // Get the most recent news hook for the user's industry
  const latestNewsHook = newsHooks.length > 0 ? newsHooks[0] : null;

  const handleUseHook = (hookText: string) => {
    const encodedText = encodeURIComponent(hookText);
    router.push(`/create/edit?text=${encodedText}`);
  };

  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-white/70 gap-4">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      <p>Curating the latest stories for you...</p>
    </div>
  );

  const renderErrorState = () => (
    <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-6 text-white">
      <p className="font-medium mb-2">We couldn&apos;t load fresh stories.</p>
      <p className="text-sm text-white/80">{errorMessage}</p>
    </div>
  );

  const renderNewsSection = () => {
    if (!latestNewsHook) {
      return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-white/80">
          No stories are available right now. Please try refreshing in a moment.
        </div>
      );
    }

    const metaDate = formatMetaDate(latestNewsHook.created_at);
    const industryName = latestNewsHook.industry || 'Industry';

    return (
      <section className="mb-12 animate-[fade-in_0.6s_ease-out]">
        <div className="flex items-center gap-2 text-white/40 text-sm mb-6">
          <span className="uppercase tracking-wide">{industryName}</span>
          <span>|</span>
          <span>{metaDate}</span>
        </div>

        <h2 className="text-2xl font-normal text-white mb-6 leading-tight max-w-4xl">
          {industryName} News Summary
        </h2>

        <p className="text-white/70 max-w-4xl mb-8 text-lg leading-relaxed">
          {latestNewsHook.summary}
        </p>

        {latestNewsHook.hooks && latestNewsHook.hooks.length > 0 && (
          <div className="mt-10">
            <h3 className="text-xl font-medium text-white mb-6">LinkedIn Post Hooks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {latestNewsHook.hooks.map((hook, index) => (
                <div
                  key={index}
                  className="bg-brand-dark/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/40 transition-all duration-300 flex flex-col"
                >
                  <p className="text-white/90 leading-relaxed mb-4 flex-1">{hook}</p>
                  <button
                    onClick={() => handleUseHook(hook)}
                    className="w-full mt-4 py-2 text-white rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                    style={{ backgroundColor: '#9BC6E9' }}
                  >
                    Use Hook
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  };

  return (
    <AuthGuard>
      <div
        className="min-h-screen px-8 py-10 sm:px-10 lg:px-12"
        style={{
          background: 'var(--astro-hero-gradient)',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-medium text-white">Never miss the moment.</h1>
          </div>

          <div className="border-b border-white/20 mb-6"></div>

          <div className="flex items-center gap-4 mb-10">
            <button className="px-5 py-2 rounded-full text-sm font-medium border transition-all bg-brand-blue text-white border-brand-blue">
              Trending Stories
            </button>
          </div>

          {isLoading && renderLoadingState()}
          {!isLoading && errorMessage && renderErrorState()}
          {!isLoading && !errorMessage && renderNewsSection()}
        </div>
      </div>
    </AuthGuard>
  );
}
