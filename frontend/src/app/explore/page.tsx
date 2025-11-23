'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { StoryCard, StoryTag } from './components/StoryCard';
import { FaChevronRight } from 'react-icons/fa';

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState('Trending Stories');

  const tabs = ['Trending Stories', 'Repackage', 'Thought Prompts'];

  const stories = [
    {
      id: 1,
      content: 'What if working less actually made your team achieve more?',
      tag: 'Thought-Provoking' as StoryTag,
    },
    {
      id: 2,
      content: 'The 4-hour workday experiment that\'s making every manager rethink time management',
      tag: 'Insightful' as StoryTag,
    },
    {
      id: 3,
      content: 'Maybe hustle culture was the real productivity killer all along...',
      tag: 'Contrarian' as StoryTag,
    },
  ];

  const secondaryStories = [
    {
      id: 4,
      content: 'Here\'s the one thing that I stopped doing that made everything else easier',
      tag: 'Engaging' as StoryTag,
    },
    {
      id: 5,
      content: 'Most startups don\'t need more goals. They need fewer ones done well',
      tag: 'Insightful' as StoryTag,
    },
    {
      id: 6,
      content: 'The hardest part about leadership is saying no—again and again',
      tag: 'Thought-Provoking' as StoryTag,
    },
  ];

  return (
    <AuthGuard>
      <div
        className="min-h-screen px-8 py-10 sm:px-10 lg:px-12"
        style={{
          background: 'var(--astro-hero-gradient)',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-medium text-white mb-8">Never miss the moment.</h1>

          {/* Tabs */}
          <div className="flex items-center gap-4 mb-10">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-sm font-medium border transition-all ${
                  activeTab === tab
                    ? 'bg-brand-blue text-white border-brand-blue'
                    : 'bg-transparent text-white/60 border-white/20 hover:bg-white/5 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Featured Story Section */}
          <div className="mb-12 animate-[fade-in_0.6s_ease-out]">
            <h2 className="text-2xl font-normal text-white mb-2 leading-tight max-w-4xl">
              100-Person Startup Adopts 4-Hour Workday, Employees Report Higher Output
            </h2>
            <div className="flex items-center gap-2 text-white/40 text-sm mb-6">
              <span>Source</span>
              <span>|</span>
              <span>Date</span>
            </div>

            {/* Story Grid */}
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map(story => (
                  <StoryCard key={story.id} content={story.content} tag={story.tag} />
                ))}
              </div>
              
              <div className="absolute top-1/2 -right-16 transform -translate-y-1/2 hidden xl:flex">
                <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                   <FaChevronRight />
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Section */}
          <div className="mb-12 animate-[fade-in_0.6s_ease-out] delay-100">
             <h2 className="text-2xl font-normal text-white mb-2 leading-tight">
              If everything's a priority, nothing is.
            </h2>
            <div className="flex items-center gap-2 text-white/40 text-sm mb-6">
              <span>Source</span>
              <span>|</span>
              <span>Date</span>
            </div>

             {/* Story Grid 2 */}
             <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {secondaryStories.map(story => (
                  <StoryCard key={story.id} content={story.content} tag={story.tag} />
                ))}
              </div>
               
               {/* Action Button */}
              <div className="absolute top-1/2 -right-16 transform -translate-y-1/2 hidden xl:flex">
                <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                   <FaChevronRight />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AuthGuard>
  );
}
