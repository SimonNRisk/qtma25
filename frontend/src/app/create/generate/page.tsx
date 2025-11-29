'use client';

import { useState, useRef, useEffect } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { FaMicrophone, FaPaperPlane, FaEdit, FaStar, FaComments, FaStop } from 'react-icons/fa';
import { useStreamingGenerate, ChatMessage, StreamingHook } from './hooks/useStreamingGenerate';
import { ChatMessage as ChatMessageComponent } from './components/ChatMessage';
import { HookSuggestion } from './components/HookSuggestion';

export default function GeneratePage() {
  const [query, setQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const userHasScrolledRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);

  const {
    isGenerating,
    error,
    messages,
    hooks,
    currentStreamingContent,
    copiedId,
    generatePosts,
    cancelGeneration,
    bookmarkHook,
    copyToClipboard,
    editMessage,
  } = useStreamingGenerate({ quantity: 3, length: 2 });

  // Check if user is near bottom (within 100px)
  const isNearBottom = () => {
    if (!chatContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  };

  // Scroll to bottom
  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Handle scroll events to detect user interaction
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!isNearBottom()) {
        userHasScrolledRef.current = true;
        shouldAutoScrollRef.current = false;
      } else if (isNearBottom() && userHasScrolledRef.current) {
        // User scrolled back to bottom, re-enable auto-scroll
        userHasScrolledRef.current = false;
        shouldAutoScrollRef.current = true;
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to bottom when new messages or hooks arrive, but only if user hasn't scrolled away
  useEffect(() => {
    if (shouldAutoScrollRef.current && (isGenerating || isNearBottom())) {
      scrollToBottom('smooth');
    }
  }, [messages, hooks, currentStreamingContent, isGenerating]);

  const handleQuickPrompt = (prompt: string) => {
    setQuery(prompt);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isGenerating) return;
    
    // Reset scroll tracking and enable auto-scroll
    userHasScrolledRef.current = false;
    shouldAutoScrollRef.current = true;
    
    generatePosts(query);
    setQuery('');
    
    // Scroll to bottom after a brief delay to ensure message is added
    setTimeout(() => {
      scrollToBottom('smooth');
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col text-white overflow-hidden relative" style={{ height: 'calc(100vh - 260px)', minHeight: '400px' }}>
      {/* Chat Messages Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-1 space-y-4 min-h-0 pb-20 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
          {messages.length === 0 && hooks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="flex flex-col items-center gap-1.5 max-w-2xl px-4">
                <h2 className="text-lg sm:text-xl font-medium text-foreground">
                  Keep your content ideas flowing.
                </h2>
                <p className="text-white/60 text-xs mb-0.5">Start a conversation to generate hooks</p>
                
                {/* Quick Prompts */}
                <div className="flex flex-wrap items-center justify-center gap-1 text-white/90 text-xs mt-1">
                  <button
                    onClick={() => handleQuickPrompt('Write me a post in my style')}
                    className="flex items-center gap-1 px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <FaEdit className="w-2.5 h-2.5" />
                    <span>Write me a post in my style</span>
                  </button>
                  <button
                    onClick={() => handleQuickPrompt('Refine my draft')}
                    className="flex items-center gap-1 px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <FaStar className="w-2.5 h-2.5" />
                    <span>Refine my draft</span>
                  </button>
                  <button
                    onClick={() => handleQuickPrompt('Tell me how my recent post did')}
                    className="flex items-center gap-1 px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <FaComments className="w-2.5 h-2.5" />
                    <span>Tell me how my recent post did</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((message) => (
            <ChatMessageComponent
              key={message.id}
              message={message}
              onEdit={editMessage}
              isStreaming={isGenerating && message.role === 'assistant' && message.id === messages[messages.length - 1]?.id}
            />
          ))}

          {/* Streaming Content */}
          {isGenerating && currentStreamingContent && (
            <div className="flex justify-start mb-6">
              <div className="max-w-[80%] bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20 shadow-lg">
                <div className="text-white/90 whitespace-pre-wrap">
                  {currentStreamingContent}
                  <span className="inline-block w-2 h-4 bg-brand-dark ml-1 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* Generated Hooks */}
          {hooks.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-medium text-foreground mb-4">
                Generated Hooks ({hooks.length})
              </h3>
              {hooks.map((hook) => (
                <HookSuggestion
                  key={hook.id}
                  hook={hook}
                  onBookmark={bookmarkHook}
                  onCopy={copyToClipboard}
                  copiedId={copiedId}
                />
              ))}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="fixed bottom-0 left-20 right-0 px-4 py-2 border-t border-white/20 bg-white/5 backdrop-blur-sm z-10">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <div
                  className="flex items-center bg-white rounded-full shadow-[0_25px_55px_rgba(21,55,83,0.55)] overflow-hidden border"
                  style={{ borderColor: 'var(--astro-sky)' }}
                >
                  {/* Microphone Icon */}
                  <button
                    type="button"
                    className="pl-4 pr-2 py-2.5 text-brand-dark hover:opacity-80 transition-colors"
                    aria-label="Voice input"
                  >
                    <FaMicrophone className="w-4 h-4" />
                  </button>

                  {/* Input Field */}
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask Astro Anything..."
                    disabled={isGenerating}
                    className="flex-1 py-2.5 px-2 text-sm placeholder-gray-500 focus:outline-none bg-transparent disabled:opacity-50"
                    style={{ color: 'var(--astro-midnight)' }}
                  />

                  {/* Submit/Stop Button */}
                  <button
                    type={isGenerating ? 'button' : 'submit'}
                    onClick={isGenerating ? cancelGeneration : undefined}
                    disabled={!query.trim() && !isGenerating}
                    className="mr-2 p-1.5 bg-brand-dark hover:bg-brand-blue rounded-full transition-colors border border-brand-dark shadow-[0_10px_25px_rgba(20,56,84,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={isGenerating ? 'Stop generation' : 'Submit'}
                  >
                    {isGenerating ? (
                      <FaStop className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <FaPaperPlane className="w-3.5 h-3.5 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
}
