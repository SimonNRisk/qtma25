'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { FaMicrophone, FaPaperPlane, FaEdit, FaStar, FaComments } from 'react-icons/fa';
import { useGeneratePosts, GeneratedPost } from './hooks/useGeneratePosts';
import { GeneratedPostCard } from './components/GeneratedPostCard';

export default function GeneratePage() {
  const [query, setQuery] = useState('');

  const {
    isGenerating,
    error,
    generatedPosts,
    copiedId,
    generatePosts,
    bookmarkPost,
    copyToClipboard,
  } = useGeneratePosts({ quantity: 5, length: 2 });

  const handleQuickPrompt = (prompt: string) => {
    setQuery(prompt);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    generatePosts(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleBookmark = (post: GeneratedPost, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking bookmark
    bookmarkPost(post);
  };

  return (
    <AuthGuard>
      <div className="text-white">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-left text-4xl sm:text-5xl font-medium tracking-tight mb-6 leading-tight text-foreground">
            Keep your content ideas
            <br />
            flowing.
          </h1>
          <div className="h-px w-full max-w-3xl mr-auto bg-white/30 mb-6" />

          {/* Main Input Box */}
          <div className="mb-8">
            <div className="relative max-w-3xl mx-auto">
              <div
                className="flex items-center bg-white rounded-full shadow-[0_25px_55px_rgba(21,55,83,0.55)] overflow-hidden border"
                style={{ borderColor: 'var(--astro-sky)' }}
              >
                {/* Microphone Icon */}
                <button
                  type="button"
                  className="pl-6 pr-4 py-4 text-brand-dark hover:opacity-80 transition-colors"
                  aria-label="Voice input"
                >
                  <FaMicrophone className="w-6 h-6" />
                </button>

                {/* Input Field */}
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Astro Anything..."
                  className="flex-1 py-4 px-2 text-base placeholder-gray-500 focus:outline-none bg-transparent"
                  style={{ color: 'var(--astro-midnight)' }}
                />

                {/* Submit Button */}
                <button
                  onClick={() => handleSubmit()}
                  disabled={isGenerating || !query.trim()}
                  className="mr-3 p-2.5 bg-brand-dark hover:bg-brand-blue rounded-full transition-colors border border-brand-dark shadow-[0_10px_25px_rgba(20,56,84,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Submit"
                >
                  {isGenerating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FaPaperPlane className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-white/90 text-sm mb-8">
            <button
              onClick={() => handleQuickPrompt('Write me a post in my style')}
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <FaEdit className="w-4 h-4" aria-hidden="true" />
              <span>Write me a post in my style</span>
            </button>
            <button
              onClick={() => handleQuickPrompt('Refine my draft')}
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <FaStar className="w-4 h-4" aria-hidden="true" />
              <span>Refine my draft</span>
            </button>
            <button
              onClick={() => handleQuickPrompt('Tell me how my recent post did')}
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <FaComments className="w-4 h-4" aria-hidden="true" />
              <span>Tell me how my recent post did</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
              <p className="text-white/80">Generating your content ideas...</p>
            </div>
          )}

          {/* Generated Posts */}
          {generatedPosts.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-medium text-foreground mb-6">
                Generated Posts ({generatedPosts.length})
              </h2>
              <div className="grid grid-cols-1 gap-6">
                {generatedPosts.map(post => (
                  <GeneratedPostCard
                    key={post.id}
                    post={post}
                    copiedId={copiedId}
                    onBookmark={handleBookmark}
                    onCopy={copyToClipboard}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
