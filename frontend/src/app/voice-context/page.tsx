'use client';

import { useState, useEffect } from 'react';
import VoiceRecorder from '../../components/VoiceRecorder';

interface VoiceContext {
  id: string;
  transcription: string;
  summary: string;
  category: string;
  created_at: string;
  key_topics?: string;
  insights?: string;
}

export default function VoiceContextPage() {
  const [contexts, setContexts] = useState<VoiceContext[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'company', label: 'Company' },
    { value: 'personal', label: 'Personal' },
    { value: 'preferences', label: 'Preferences' },
    { value: 'expertise', label: 'Expertise' }
  ];

  useEffect(() => {
    fetchContexts();
  }, []);

  const fetchContexts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/voice/contexts?limit=20', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch contexts');
      }

      const data = await response.json();
      setContexts(data.contexts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contexts');
    } finally {
      setLoading(false);
    }
  };

  const handleTranscriptionComplete = (transcription: string, summary: string, category: string) => {
    // Add new context to the list
    const newContext: VoiceContext = {
      id: Date.now().toString(), // Temporary ID
      transcription,
      summary,
      category,
      created_at: new Date().toISOString()
    };
    
    setContexts(prev => [newContext, ...prev]);
    
    // Refresh the full list to get the real ID and any server-side processing
    setTimeout(fetchContexts, 1000);
  };

  const deleteContext = async (contextId: string) => {
    try {
      const response = await fetch(`/api/voice/contexts/${contextId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete context');
      }

      setContexts(prev => prev.filter(ctx => ctx.id !== contextId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete context');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Voice Context</h1>
          <p className="text-gray-600">
            Share your thoughts, preferences, and experiences through voice to enrich your content generation.
          </p>
        </div>

        {/* Recording Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6">
            <div className="flex-1 mb-4 lg:mb-0">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Record New Context</h2>
              <p className="text-gray-600 text-sm mb-4">
                Choose a category and start recording. Your voice will be transcribed and analyzed to extract key insights.
              </p>
              
              {/* Category Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <VoiceRecorder
                category={selectedCategory}
                onTranscriptionComplete={handleTranscriptionComplete}
              />
            </div>
          </div>
        </div>

        {/* Contexts List */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Voice Contexts</h2>
            <p className="text-gray-600 text-sm mt-1">
              Manage and review your recorded contexts
            </p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 mt-2">Loading contexts...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-2">⚠️ {error}</div>
                <button
                  onClick={fetchContexts}
                  className="text-blue-500 hover:text-blue-700 underline"
                >
                  Try again
                </button>
              </div>
            ) : contexts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg mb-2">🎤</div>
                <p className="text-gray-600">No voice contexts yet. Start recording to add some!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contexts.map((context) => (
                  <div key={context.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {context.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(context.created_at)}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteContext(context.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                    
                    <div className="mb-3">
                      <h3 className="font-medium text-gray-900 mb-1">Summary</h3>
                      <p className="text-gray-700 text-sm">{context.summary}</p>
                    </div>
                    
                    <details className="group">
                      <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
                        View full transcription
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700">
                        {context.transcription}
                      </div>
                    </details>
                    
                    {context.key_topics && (
                      <div className="mt-2 text-xs text-gray-500">
                        <strong>Key topics:</strong> {context.key_topics}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
