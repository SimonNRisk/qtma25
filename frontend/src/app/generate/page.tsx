'use client';

import { useState, useEffect } from 'react';

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useVoiceContext, setUseVoiceContext] = useState(true);
  const [voiceContextSummary, setVoiceContextSummary] = useState('');
  const [loadingContext, setLoadingContext] = useState(false);

  useEffect(() => {
    if (useVoiceContext) {
      fetchVoiceContext();
    }
  }, [useVoiceContext]);

  const fetchVoiceContext = async () => {
    setLoadingContext(true);
    try {
      const response = await fetch('/api/voice/context-summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVoiceContextSummary(data.context_summary || '');
      }
    } catch (error) {
      console.error('Failed to fetch voice context:', error);
    } finally {
      setLoadingContext(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      // Enhance prompt with voice context if enabled
      let enhancedPrompt = prompt;
      if (useVoiceContext && voiceContextSummary) {
        enhancedPrompt = `Context about the user: ${voiceContextSummary}\n\nUser request: ${prompt}\n\nPlease generate content that takes into account the user's context and preferences mentioned above.`;
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: enhancedPrompt }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedText(data.generatedText);
      } else {
        console.error('Error:', data.error);
        setGeneratedText('Error generating content. Please try again.');
      }
    } catch (error) {
      console.error('Request failed:', error);
      setGeneratedText('Error generating content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Content Generation</h1>
          <p className="text-gray-600">Generate personalized content using your voice context and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Generation Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <form onSubmit={handleSubmit} className="mb-6">
                <div className="mb-4">
                  <label htmlFor="prompt" className="block text-sm font-medium mb-2">
                    What would you like to generate?
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    placeholder="E.g., Write a LinkedIn post about my recent project, Create a blog intro about AI trends, Draft an email to my team..."
                    disabled={isLoading}
                  />
                </div>

                {/* Voice Context Toggle */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={useVoiceContext}
                      onChange={(e) => setUseVoiceContext(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">
                        Use Voice Context
                      </span>
                      <p className="text-xs text-gray-600">
                        Include your recorded preferences and context in generation
                      </p>
                    </div>
                    {loadingContext && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </label>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Generating...
                      </span>
                    ) : (
                      'Generate Content'
                    )}
                  </button>
                  
                  <a
                    href="/voice-context"
                    className="px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                  >
                    🎤 Voice
                  </a>
                </div>
              </form>

              {generatedText && (
                <div className="border-t pt-6">
                  <h2 className="text-lg font-semibold mb-3 text-gray-900">Generated Content:</h2>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{generatedText}</p>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedText)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => setGeneratedText('')}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      🗑️ Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Context Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Your Context</h3>
              
              {loadingContext ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading context...</p>
                </div>
              ) : voiceContextSummary ? (
                <div className="space-y-3">
                  <div className="text-sm text-green-600 font-medium">✓ Voice context loaded</div>
                  <div className="bg-green-50 p-3 rounded text-sm text-gray-700 max-h-40 overflow-y-auto">
                    {voiceContextSummary}
                  </div>
                  <button
                    onClick={fetchVoiceContext}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    🔄 Refresh context
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-gray-400 text-2xl mb-2">🎤</div>
                  <p className="text-sm text-gray-600 mb-3">No voice context available</p>
                  <a
                    href="/voice-context"
                    className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    Record Context
                  </a>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Tips</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Record your preferences via voice</li>
                  <li>• Share your expertise and background</li>
                  <li>• Mention your writing style preferences</li>
                  <li>• Include company/project context</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
