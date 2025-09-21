'use client';

import { useState } from 'react';

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
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
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Generate Content</h1>
        
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <label htmlFor="prompt" className="block text-sm font-medium mb-2">
              Enter a prompt:
            </label>
            <input
              type="text"
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a prompt to generate content..."
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </form>

        {generatedText && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg text-black font-semibold mb-3">Generated Content:</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{generatedText}</p>
          </div>
        )}
      </div>
    </div>
  );
}
