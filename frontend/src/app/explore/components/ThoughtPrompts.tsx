'use client';

import React, { useState, useEffect } from 'react';
import { FaMicrophone, FaSync } from 'react-icons/fa';
import { useThoughtPrompt } from '../hooks/useThoughtPrompt';
import { useSubmitThoughtResponse } from '../hooks/useSubmitThoughtResponse';

interface CustomizationOptions {
  postLength: string;
  numberOfHooks: string;
  targetAudience: string;
  tone: string;
}

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
  };

  const handleRefreshPrompt = async () => {
    resetForm();
    await fetchRandom();
  };

  const handleCustomizationChange = (field: keyof CustomizationOptions, value: string) => {
    setCustomization(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!prompt || !reflection.trim()) return;

    clearError();
    setSubmitSuccess(false);

    const result = await submitResponse(prompt.id, reflection);

    if (result) {
      setSubmitSuccess(true);
      // Reset form after successful submission
      resetForm();
      // Note: In a full implementation, you'd also trigger post generation here
      // using the customization options
      console.log('Response submitted successfully', {
        response: result,
        customization,
      });
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

        {/* Generate Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !reflection.trim()}
          className="w-full mt-8 py-4 rounded-xl text-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-astro-sky text-astro-panel-dark"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></span>
              Generating...
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
      </div>
    </div>
  );
}
