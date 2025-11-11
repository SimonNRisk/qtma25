'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';

type TabType = 'trending' | 'repackage' | 'chat';

export default function GeneratePage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  const handleQuickPrompt = (prompt: string) => {
    setQuery(prompt);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // No-op: functionality removed
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <AuthGuard>
      <div
        className="min-h-screen px-4 py-20 sm:px-6 lg:px-8"
        style={{
          background: 'var(--astro-hero-gradient)',
        }}
      >
        <div className="max-w-5xl mx-auto text-white">
          {/* Header */}
          <div className="text-center mb-14">
            <h1 className="text-left text-4xl sm:text-5xl font-medium tracking-tight mb-6 leading-tight text-foreground">
              Keep your content ideas
              <br />
              flowing.
            </h1>
            <div className="h-px w-full max-w-3xl mr-auto bg-white/30 mb-6" />

            {/* Tab Pills */}
            <div className="flex items-center justify-start gap-4 mb-12">
              <button
                onClick={() => setActiveTab('trending')}
                className={`px-6 py-2 rounded-xl text-sm font-normal transition-all border ${
                  activeTab === 'trending'
                    ? 'border-foreground bg-white/20 text-foreground shadow-[0_8px_20px_rgba(12,31,45,0.35)]'
                    : 'border-white/40 text-white/80 hover:border-white/70'
                }`}
              >
                Trending Stories
              </button>
              <button
                onClick={() => setActiveTab('repackage')}
                className={`px-6 py-2 rounded-xl text-sm font-normal transition-all border ${
                  activeTab === 'repackage'
                    ? 'border-foreground bg-white/20 text-foreground shadow-[0_8px_20px_rgba(12,31,45,0.35)]'
                    : 'border-white/40 text-white/80 hover:border-white/70'
                }`}
              >
                Repackage
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-6 py-2 rounded-xl text-sm font-normal transition-all border ${
                  activeTab === 'chat'
                    ? 'border-foreground bg-white/20 text-foreground shadow-[0_8px_20px_rgba(12,31,45,0.35)]'
                    : 'border-white/40 text-white/80 hover:border-white/70'
                }`}
              >
                Chat
              </button>
            </div>

            {/* Main Input Box */}
            <div className="mb-8">
              <div className="relative max-w-3xl mx-auto">
                <div className="flex items-center bg-white rounded-full shadow-[0_25px_55px_rgba(21,55,83,0.55)] overflow-hidden border" style={{ borderColor: 'var(--astro-sky)' }}>
                  {/* Microphone Icon */}
                  <button
                    type="button"
                    className="pl-6 pr-4 py-4 text-brand-dark hover:opacity-80 transition-colors"
                    aria-label="Voice input"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  </button>

                  {/* Input Field */}
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask Astro Anything..."
                    className="flex-1 py-4 px-2 text-base placeholder-gray-500 focus:outline-none bg-transparent" style={{ color: 'var(--astro-midnight)' }}
                  />

                  {/* Submit Button */}
                  <button
                    onClick={() => handleSubmit()}
                    className="mr-3 p-2.5 bg-brand-dark hover:bg-brand-blue rounded-full transition-colors border border-brand-dark shadow-[0_10px_25px_rgba(20,56,84,0.45)]"
                    aria-label="Submit"
                  >
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 3a1 1 0 0 1 .894.553l3 6A1 1 0 0 1 13 11h-2v5a1 1 0 1 1-2 0v-5H7a1 1 0 0 1-.894-1.447l3-6A1 1 0 0 1 10 3z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-white/90 text-sm">
              <button
                onClick={() => handleQuickPrompt('Write me a post in my style')}
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
                <span>Write me a post in my style</span>
              </button>
              <button
                onClick={() => handleQuickPrompt('Refine my draft')}
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.786 1.402 8.171L12 18.896l-7.336 3.872 1.402-8.171L.132 9.211l8.2-1.193L12 .587z" />
                </svg>
                <span>Refine my draft</span>
              </button>
              <button
                onClick={() => handleQuickPrompt('Tell me how my recent post did')}
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                </svg>
                <span>Tell me how my recent post did</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
