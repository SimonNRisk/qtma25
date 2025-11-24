'use client';

import React from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { TrendingStories } from './components/TrendingStories';

export default function ExplorePage() {
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

          <TrendingStories />
        </div>
      </div>
    </AuthGuard>
  );
}
