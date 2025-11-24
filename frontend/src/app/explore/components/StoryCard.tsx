import React from 'react';
import { FaArrowRight } from 'react-icons/fa';

export interface NewsArticle {
  title: string;
  description?: string | null;
  url: string;
  published_at?: string | null;
  source?: string | null;
}

interface StoryCardProps {
  article: NewsArticle;
  industry: string;
  className?: string;
}

const formatPublishedDate = (publishedAt?: string | null) => {
  if (!publishedAt) return null;
  const parsed = new Date(publishedAt);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
};

export function StoryCard({ article, industry, className = '' }: StoryCardProps) {
  const publishedDate = formatPublishedDate(article.published_at);
  const sourceLabel = article.source || industry;

  return (
    <article
      className={`bg-brand-dark/30 backdrop-blur-sm border border-white/10 rounded-xl p-5 flex flex-col gap-4 relative group hover:border-white/40 transition-all duration-300 ${className}`}
    >
      <div className="space-y-2 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-white/60">{industry}</p>
        <h3 className="text-lg font-semibold text-white leading-snug">{article.title}</h3>
        {article.description && (
          <p className="text-sm text-white/70 leading-relaxed">{article.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-white/50 pt-2 border-t border-white/10">
        <span className="truncate">{sourceLabel}</span>
        {publishedDate && <time dateTime={article.published_at || undefined}>{publishedDate}</time>}
      </div>

      <a
        href={article.url}
        target="_blank"
        rel="noreferrer"
        className="w-full mt-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-white transition-all group-hover:bg-brand-blue/40"
      >
        Read article
        <FaArrowRight className="w-3 h-3" />
      </a>
    </article>
  );
}
