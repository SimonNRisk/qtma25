'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { TrendingStories } from './components/TrendingStories';
import { ThoughtPrompts } from './components/ThoughtPrompts';

type TabType = 'trending' | 'repackage' | 'thought-prompts';

interface Tab {
  id: TabType;
  label: string;
}

const TABS: Tab[] = [
  { id: 'trending', label: 'Trending Stories' },
  { id: 'repackage', label: 'Repackage' },
  { id: 'thought-prompts', label: 'Thought Prompts' },
];

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<TabType>('trending');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'trending':
        return <TrendingStories />;
      case 'repackage':
        return (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-white/80">
            Repackage feature coming soon. Stay tuned!
          </div>
        );
      case 'thought-prompts':
        return <ThoughtPrompts />;
      default:
        return null;
    }
  };

  // Dynamic heading based on active tab
  const getHeading = () => {
    switch (activeTab) {
      case 'trending':
        return 'Never miss the moment.';
      case 'repackage':
        return 'Transform your content.';
      case 'thought-prompts':
        return 'Honest thoughts become powerful content.';
      default:
        return 'Never miss the moment.';
    }
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
          {/* Dynamic Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-medium text-white">{getHeading()}</h1>
          </div>

          <div className="border-b border-white/20 mb-6"></div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-4 mb-10">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-full text-sm font-medium border transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-blue text-white border-brand-blue'
                    : 'bg-transparent text-white/70 border-white/30 hover:border-white/50 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </div>
    </AuthGuard>
  );
}
