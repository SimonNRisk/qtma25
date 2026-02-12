'use client';

import React, { useState, useEffect } from 'react';
import { FaMicrophone, FaSync } from 'react-icons/fa';
import { API_URL } from '@/lib/api';
import { useThoughtPrompt } from '../hooks/useThoughtPrompt';
import { useSubmitThoughtResponse } from '../hooks/useSubmitThoughtResponse';

interface CustomizationOptions {
  postLength: string;
  numberOfHooks: string;
  targetAudience: string;
  tone: string;
}

const normalizePostLength = (value: string): number | null => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (['1', 'short', 's'].includes(normalized)) return 1;
  if (['2', 'medium', 'med', 'm'].includes(normalized)) return 2;
  if (['3', 'long', 'l'].includes(normalized)) return 3;
  return null;
};

const parseHookCount = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isNaN(parsed)) return null;
  return parsed;
};

export function ThoughtPrompts() {
  const {
    prompt,
    hasResponded,
    existingResponse,
    loading: promptLoading,
    error: promptError,
    fetchRandom,
  } = useThoughtPrompt();

  const {
    submitResponse,
    isSubmitting,
    error: submitError,
    clearError,
  } = useSubmitThoughtResponse();

  // Form state
  const [reflection, setReflection] = useState('');
  const [customization, setCustomization] = useState<CustomizationOptions>({
    postLength: '',
    numberOfHooks: '',
    targetAudience: '',
    tone: '',
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<string[]>([]);
  const [isGeneratingPosts, setIsGeneratingPosts] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copiedPostIndex, setCopiedPostIndex] = useState<number | null>(null);

  // Pre-fill with existing response if user has already responded
  useEffect(() => {
    if (existingResponse) {
      setReflection(existingResponse);
    }
  }, [existingResponse]);

  // Clear success message after a few seconds
  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => setSubmitSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess]);

  const resetForm = () => {
    setReflection('');
    setCustomization({
      postLength: '',
      numberOfHooks: '',
      targetAudience: '',
      tone: '',
    });
    setSubmitSuccess(false);
    clearError();
    setGeneratedPosts([]);
    setGenerationError(null);
    setCopiedPostIndex(null);
  };

  const handleRefreshPrompt = async () => {
    resetForm();
    await fetchRandom();
  };

  const handleCustomizationChange = (field: keyof CustomizationOptions, value: string) => {
    setCustomization(prev => ({ ...prev, [field]: value }));
  };

  const hasCustomization = (options: CustomizationOptions) =>
    Object.values(options).some(value => value.trim().length > 0);

  const handleCopyPost = async (post: string, index: number) => {
    try {
      await navigator.clipboard.writeText(post);
      setCopiedPostIndex(index);
      setTimeout(() => setCopiedPostIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy post:', err);
    }
  };

  const generatePostsFromReflection = async (
    reflectionText: string,
    question: string,
    options: CustomizationOptions
  ) => {
    const requestedLength = normalizePostLength(options.postLength);
    if (options.postLength.trim() && requestedLength === null) {
      setGenerationError('Post length must be Short, Medium, or Long (or 1, 2, 3).');
      return;
    }

    const requestedQuantity = parseHookCount(options.numberOfHooks);
    if (options.numberOfHooks.trim()) {
      if (!requestedQuantity || requestedQuantity < 3) {
        setGenerationError('Number of hooks must be a whole number of 3 or more.');
        return;
      }
    }

    const length = requestedLength ?? 2;
    const quantity = requestedQuantity ?? 3;
    const audience = options.targetAudience.trim();
    const tone = options.tone.trim();
    const context = `Prompt: ${question}\nReflection: ${reflectionText}`;

    setIsGeneratingPosts(true);
    setGenerationError(null);
    setGeneratedPosts([]);
    setCopiedPostIndex(null);

    try {
      const response = await fetch(`${API_URL}/api/openai/generate-posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          quantity,
          context,
          length,
          ...(tone ? { tone } : {}),
          ...(audience ? { audience } : {}),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to generate posts: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.posts)) {
        setGeneratedPosts(data.posts);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate posts';
      setGenerationError(errorMessage);
      console.error('Error generating posts:', err);
    } finally {
      setIsGeneratingPosts(false);
    }
  };

  const handleSubmit = async () => {
    if (!prompt || !reflection.trim()) return;

    clearError();
    setSubmitSuccess(false);
    setGenerationError(null);
    setGeneratedPosts([]);
    setCopiedPostIndex(null);

    const reflectionText = reflection.trim();
    const customizationSnapshot = { ...customization };
    const shouldGenerate = hasCustomization(customizationSnapshot);

    const result = await submitResponse(prompt.id, reflectionText);

    if (result) {
      setSubmitSuccess(true);
      if (shouldGenerate) {
        await generatePostsFromReflection(reflectionText, prompt.question, customizationSnapshot);
      } else {
        // Reset form after successful submission when not generating posts
        resetForm();
      }
    }
  };

  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-white/70 gap-4">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      <p>Loading thought prompt...</p>
    </div>
  );

  const renderErrorState = () => (
    <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-6 text-white">
      <p className="font-medium mb-2">We couldn&apos;t load the thought prompt.</p>
      <p className="text-sm text-white/80">{promptError}</p>
      <button
        onClick={handleRefreshPrompt}
        className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm border border-white/20 transition-colors"
      >
        Try again
      </button>
    </div>
  );

  const renderNoPromptState = () => (
    <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-white/80">
      No thought prompts are available right now. Please check back later.
    </div>
  );

  if (promptLoading) {
    return renderLoadingState();
  }

  if (promptError) {
    return renderErrorState();
  }

  if (!prompt) {
    return renderNoPromptState();
  }

  return (
    <div className="animate-[fade-in_0.6s_ease-out]">
      {/* Main Card */}
      <div className="bg-astro-panel-dark/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
        {/* Header */}
        <div className="mb-6">
          <p className="text-white/50 text-sm italic mb-3">Use this space to reflect.</p>
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl font-medium text-white leading-tight flex-1">
              {prompt.question}
            </h2>
            <button
              onClick={handleRefreshPrompt}
              disabled={promptLoading}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Get a different prompt"
              aria-label="Refresh prompt"
            >
              <FaSync className={`w-4 h-4 ${promptLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Your Reflection */}
          <div>
            <label className="block text-white font-medium mb-3">Your Reflection</label>
            <div className="relative">
              <textarea
                value={reflection}
                onChange={e => setReflection(e.target.value)}
                placeholder="Share the moment, lesson, or insight..."
                className="w-full h-48 px-4 py-3 bg-white rounded-xl text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-astro-sky"
                maxLength={5000}
              />
              <button
                className="absolute bottom-3 left-3 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Voice input (coming soon)"
                aria-label="Voice input"
              >
                <FaMicrophone className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-2 text-right text-white/40 text-xs">{reflection.length}/5000</div>
          </div>

          {/* Right Column - Customization Options */}
          <div>
            <label className="block text-white font-medium mb-3">
              Customize Your Post (Optional)
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Post Length */}
              <div>
                <label className="block text-white/70 text-sm mb-2">Post Length</label>
                <input
                  type="text"
                  value={customization.postLength}
                  onChange={e => handleCustomizationChange('postLength', e.target.value)}
                  placeholder="e.g., Short, Medium, Long"
                  className="w-full px-4 py-3 bg-white rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-astro-sky"
                />
              </div>

              {/* Number of Hooks */}
              <div>
                <label className="block text-white/70 text-sm mb-2">Number of Hooks</label>
                <input
                  type="text"
                  value={customization.numberOfHooks}
                  onChange={e => handleCustomizationChange('numberOfHooks', e.target.value)}
                  placeholder="e.g., 3, 5"
                  className="w-full px-4 py-3 bg-white rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-astro-sky"
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-white/70 text-sm mb-2">Target Audience</label>
                <input
                  type="text"
                  value={customization.targetAudience}
                  onChange={e => handleCustomizationChange('targetAudience', e.target.value)}
                  placeholder="e.g., Founders, Engineers"
                  className="w-full px-4 py-3 bg-white rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-astro-sky"
                />
              </div>

              {/* Tone */}
              <div>
                <label className="block text-white/70 text-sm mb-2">Tone</label>
                <input
                  type="text"
                  value={customization.tone}
                  onChange={e => handleCustomizationChange('tone', e.target.value)}
                  placeholder="e.g., Professional, Casual"
                  className="w-full px-4 py-3 bg-white rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-astro-sky"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200 text-sm">
            {submitError}
          </div>
        )}

        {/* Success Message */}
        {submitSuccess && (
          <div className="mt-6 p-4 bg-green-500/20 border border-green-500/40 rounded-lg text-green-200 text-sm">
            Your reflection has been saved successfully!
          </div>
        )}

        {/* Generation Error */}
        {generationError && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200 text-sm">
            {generationError}
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isGeneratingPosts || !reflection.trim()}
          className="w-full mt-8 py-4 rounded-xl text-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-astro-sky text-astro-panel-dark"
        >
          {isSubmitting || isGeneratingPosts ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></span>
              {isGeneratingPosts ? 'Generating posts...' : 'Saving...'}
            </span>
          ) : hasResponded ? (
            'Update & Generate'
          ) : (
            'Generate'
          )}
        </button>

        {/* Previously Responded Indicator */}
        {hasResponded && !submitSuccess && (
          <p className="mt-4 text-center text-white/50 text-sm">
            You&apos;ve already responded to this prompt. Your response has been pre-filled above.
          </p>
        )}

        {/* Generated Posts */}
        {generatedPosts.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Generated Posts</h3>
              <span className="text-sm text-white/60">{generatedPosts.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {generatedPosts.map((post, index) => (
                <div
                  key={`generated-post-${index}`}
                  className="bg-white/5 border border-white/10 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-white/50 uppercase tracking-wide">
                      Post {index + 1}
                    </span>
                    <button
                      onClick={() => handleCopyPost(post, index)}
                      className="text-xs text-white/70 hover:text-white transition-colors"
                    >
                      {copiedPostIndex === index ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                    {post}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
