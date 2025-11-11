'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { session } from '@/lib/session';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function GeneratePage() {
  const [context, setContext] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [length, setLength] = useState(2); // 1=short, 2=medium, 3=long
  const [tone, setTone] = useState('');
  const [audience, setAudience] = useState('');
  const [generatedPosts, setGeneratedPosts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = session.access();
    if (!token) {
      setError('Please log in to generate hooks');
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedPosts([]);

    try {
      const response = await fetch(`${BACKEND_URL}/api/linkedin/generate-posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity,
          context: context || null,
          length,
          tone: tone || null,
          audience: audience || null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setGeneratedPosts(data.posts);
        if (data.storage?.stored) {
          console.log('Hooks stored successfully with ID:', data.storage.id);
        }
      } else {
        console.error('Error:', data.detail || data.error);
        setError(data.detail || 'Error generating posts. Please try again.');
      }
    } catch (error) {
      console.error('Request failed:', error);
      setError('Failed to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Generate LinkedIn Hooks</h1>
          <p className="text-gray-600 mb-8">Create engaging LinkedIn post hooks with AI</p>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 mb-8">
            {/* Context */}
            <div className="mb-6">
              <label htmlFor="context" className="block text-sm font-medium mb-2 text-gray-700">
                Context (Optional)
              </label>
              <textarea
                id="context"
                value={context}
                onChange={e => setContext(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="E.g., I'm building a SaaS product for startups..."
                rows={3}
                disabled={isLoading}
              />
            </div>

            {/* Quantity and Length */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium mb-2 text-gray-700">
                  Number of Hooks
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="3"
                  max="50"
                  value={quantity}
                  onChange={e => setQuantity(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="length" className="block text-sm font-medium mb-2 text-gray-700">
                  Post Length
                </label>
                <select
                  id="length"
                  value={length}
                  onChange={e => setLength(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  disabled={isLoading}
                >
                  <option value={1}>Short (~150 words)</option>
                  <option value={2}>Medium (~300 words)</option>
                  <option value={3}>Long (~500 words)</option>
                </select>
              </div>
            </div>

            {/* Tone and Audience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="tone" className="block text-sm font-medium mb-2 text-gray-700">
                  Tone (Optional)
                </label>
                <input
                  type="text"
                  id="tone"
                  value={tone}
                  onChange={e => setTone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="E.g., professional, casual, friendly"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="audience" className="block text-sm font-medium mb-2 text-gray-700">
                  Target Audience (Optional)
                </label>
                <input
                  type="text"
                  id="audience"
                  value={audience}
                  onChange={e => setAudience(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="E.g., startup founders, developers"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Generating...' : 'Generate Hooks'}
            </button>
          </form>

          {/* Generated Posts */}
          {generatedPosts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Generated Hooks ({generatedPosts.length})
                </h2>
                <a
                  href="/hooks"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All Saved Hooks →
                </a>
              </div>
              
              <div className="space-y-4">
                {generatedPosts.map((post, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold">
                        {index + 1}
                      </span>
                      <p className="flex-1 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {post}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
