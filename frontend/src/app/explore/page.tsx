'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { StoryCard, NewsArticle } from './components/StoryCard';
import { FaChevronRight, FaRedo } from 'react-icons/fa';
import { API_URL } from '@/lib/api';

interface IndustryNewsResponse {
  industry: string;
  slug: string;
  provider: string;
  summary: string;
  articles: NewsArticle[];
}

interface BulkIndustryNewsResponse {
  results: IndustryNewsResponse[];
  errors: { slug: string; status_code: number; detail: unknown }[];
}

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
  const [news, setNews] = useState<IndustryNewsResponse[]>([]);
  const [apiErrors, setApiErrors] = useState<BulkIndustryNewsResponse['errors']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mountedRef = useRef(false);

  const fetchNews = useCallback(async (options: { initial?: boolean } = {}) => {
    const { initial = false } = options;

    if (initial) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await fetch(`${API_URL}/api/news`, { cache: 'no-store' });
      if (!response.ok) {
        const payload = await response.text();
        throw new Error(payload || `Failed to fetch news (HTTP ${response.status})`);
      }

      const data = (await response.json()) as BulkIndustryNewsResponse;
      if (!mountedRef.current) return;
      setNews(data.results ?? []);
      setApiErrors(data.errors ?? []);
      setErrorMessage(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to load stories. Please try again.'
      );
    } finally {
      if (!mountedRef.current) return;
      if (initial) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchNews({ initial: true });

    const interval = setInterval(() => fetchNews(), 5 * 60 * 1000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchNews]);

  useEffect(() => {
    if (apiErrors.length > 0) {
      const unavailableIndustries = apiErrors.map(error => error.slug).join(', ');
      console.log(
        `Some industries are temporarily unavailable: ${unavailableIndustries}. We'll keep trying to pull them in.`
      );
    }
  }, [apiErrors]);

  const primaryIndustry = news[0];
  const secondaryIndustry = news[1] ?? news[0];

  const primaryArticles = primaryIndustry?.articles?.slice(0, 3) ?? [];
  const secondaryArticles =
    secondaryIndustry && secondaryIndustry === primaryIndustry
      ? (secondaryIndustry.articles?.slice(3, 6) ?? [])
      : (secondaryIndustry?.articles?.slice(0, 3) ?? []);

  const primaryMetaArticle = primaryIndustry?.articles?.[0];
  const secondaryMetaArticle =
    secondaryIndustry && secondaryIndustry !== primaryIndustry
      ? secondaryIndustry.articles?.[0]
      : (secondaryIndustry?.articles?.[3] ?? secondaryIndustry?.articles?.[0]);

  const hasData = news.length > 0;

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
      <button
        onClick={() => fetchNews()}
        className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm border border-white/20 transition-colors"
      >
        Try again
      </button>
    </div>
  );

  const renderTrendingSection = () => {
    if (!primaryIndustry) {
      return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-white/80">
          No stories are available right now. Please try refreshing in a moment.
        </div>
      );
    }

    const headline =
      primaryMetaArticle?.title || primaryIndustry.summary || `${primaryIndustry.industry} update`;
    const metaSource = primaryMetaArticle?.source || primaryIndustry.provider;
    const metaDate = formatMetaDate(primaryMetaArticle?.published_at);

    return (
      <section className="mb-12 animate-[fade-in_0.6s_ease-out]">
        <h2 className="text-2xl font-normal text-white mb-2 leading-tight max-w-4xl">{headline}</h2>
        <div className="flex items-center gap-2 text-white/40 text-sm mb-6">
          <span>{metaSource}</span>
          <span>|</span>
          <span>{metaDate}</span>
        </div>
        <p className="text-white/70 max-w-4xl mb-8">{primaryIndustry.summary}</p>

        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {primaryArticles.length > 0 ? (
              primaryArticles.map(article => (
                <StoryCard
                  key={`${primaryIndustry.slug}-${article.url}`}
                  article={article}
                  industry={primaryIndustry.industry}
                />
              ))
            ) : (
              <div className="col-span-full text-white/70">
                No articles available for this industry.
              </div>
            )}
          </div>

          <div className="absolute top-1/2 -right-16 transform -translate-y-1/2 hidden xl:flex">
            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <FaChevronRight />
            </button>
          </div>
        </div>
      </section>
    );
  };

  const renderSecondarySection = () => {
    if (!secondaryIndustry) return null;

    const headline =
      secondaryMetaArticle?.title ||
      secondaryIndustry.summary ||
      `${secondaryIndustry.industry} update`;
    const metaSource = secondaryMetaArticle?.source || secondaryIndustry.provider;
    const metaDate = formatMetaDate(secondaryMetaArticle?.published_at);

    return (
      <section className="mb-12 animate-[fade-in_0.6s_ease-out] delay-100">
        <h2 className="text-2xl font-normal text-white mb-2 leading-tight">{headline}</h2>
        <div className="flex items-center gap-2 text-white/40 text-sm mb-6">
          <span>{metaSource}</span>
          <span>|</span>
          <span>{metaDate}</span>
        </div>
        <p className="text-white/70 max-w-4xl mb-8">{secondaryIndustry.summary}</p>

        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {secondaryArticles.length > 0 ? (
              secondaryArticles.map(article => (
                <StoryCard
                  key={`${secondaryIndustry.slug}-${article.url}`}
                  article={article}
                  industry={secondaryIndustry.industry}
                />
              ))
            ) : (
              <div className="col-span-full text-white/70">
                Not enough stories yet. We&apos;ll keep refreshing your feed.
              </div>
            )}
          </div>

          <div className="absolute top-1/2 -right-16 transform -translate-y-1/2 hidden xl:flex">
            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <FaChevronRight />
            </button>
          </div>
        </div>
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
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-medium text-white">Never miss the moment.</h1>
            <button
              onClick={() => fetchNews()}
              disabled={isRefreshing}
              className="w-10 h-10 flex items-center justify-center text-white border border-white/20 rounded-lg hover:bg-white/10 disabled:opacity-60 transition-colors"
              aria-label="Refresh feed"
            >
              <FaRedo className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="border-b border-white/20 mb-6"></div>

          <div className="flex items-center gap-4 mb-10">
            <button className="px-5 py-2 rounded-full text-sm font-medium border transition-all bg-brand-blue text-white border-brand-blue">
              Trending Stories
            </button>
          </div>

          {isLoading && renderLoadingState()}
          {!isLoading && errorMessage && renderErrorState()}
          {!isLoading && !errorMessage && (
            <>
              {hasData ? (
                <>
                  {renderTrendingSection()}
                  {renderSecondarySection()}
                </>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-white/80">
                  We&apos;re not seeing any curated stories right now. Please try refreshing or
                  check back shortly.
                </div>
              )}
            </>
          )}
          {!isLoading && apiErrors.length > 0 && (
            <div className="mt-10 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm text-yellow-200">
              Some industries are temporarily unavailable:{' '}
              {apiErrors.map(error => error.slug).join(', ')}. We&apos;ll keep trying to pull them
              in.
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
