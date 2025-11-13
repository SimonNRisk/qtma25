'use client';

import { useState, useRef, useEffect } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  editedPost?: string;
}

interface AiAssistantProps {
  currentPostText: string;
  onPostUpdate: (newPostText: string) => void;
}

export const AiAssistant = ({ currentPostText, onPostUpdate }: AiAssistantProps) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmitPrompt = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) return;

    const userMessage: Message = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    const currentPrompt = prompt;
    setPrompt('');
    setIsLoading(true);

    try {
      // System prompt that instructs the AI to return only the edited post
      const systemPrompt = `You are a LinkedIn post editor. Your task is to edit the provided post content based on the user's request. 
You must respond with ONLY the edited post content - no explanations, no commentary, no additional text. 
Just return the complete edited post exactly as it should appear.`;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          systemPrompt,
          currentPostText: currentPostText || '',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // The response should be the edited post content
        const editedPost = data.generatedText.trim();
        const assistantMessage: Message = {
          role: 'assistant',
          content: editedPost,
          editedPost: editedPost,
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        console.error('Error:', data.error);
        const errorMessage: Message = {
          role: 'assistant',
          content:
            'Sorry, I had trouble generating a response. Please reach out to our support team.',
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Request failed:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content:
          'Sorry, I had trouble generating a response. Please reach out to our support team.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertPost = (editedPost: string) => {
    onPostUpdate(editedPost);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] w-full">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-medium text-white/90 mb-1">AI Post Editor</h2>
        <p className="text-sm text-white/60">Edit your LinkedIn post with AI</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/60 text-center">
            <div>
              <p className="text-base mb-2">✏️ Edit your post</p>
              <p className="text-sm">Ask me to improve, shorten, or rewrite your post!</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-white/20 text-white rounded-br-sm'
                    : 'bg-white/10 text-white/90 rounded-bl-sm border border-white/20'
                }`}
              >
                <div className="text-xs font-medium mb-1.5 text-white/70 uppercase tracking-wide">
                  {message.role === 'user' ? 'You' : 'Edited Post'}
                </div>
                <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {message.content}
                </div>
                {message.role === 'assistant' && message.editedPost && (
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <button
                      onClick={() => handleInsertPost(message.editedPost!)}
                      className="w-full bg-brand-dark hover:bg-brand-blue text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-[0_10px_25px_rgba(20,56,84,0.45)]"
                    >
                      Insert into Post
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 text-white/90 rounded-xl rounded-bl-sm px-4 py-3 border border-white/20">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
                <span className="text-sm text-white/70">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/20 pt-4">
        <form onSubmit={handleSubmitPrompt} className="flex gap-2">
          <div
            className="flex-1 flex items-center bg-white rounded-full shadow-[0_25px_55px_rgba(21,55,83,0.55)] overflow-hidden border"
            style={{ borderColor: 'var(--astro-sky)' }}
          >
            <input
              type="text"
              placeholder="e.g., Make it shorter, add emojis..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="flex-1 py-3 px-4 text-base placeholder-gray-500 focus:outline-none bg-transparent"
              style={{ color: 'var(--astro-midnight)' }}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="mr-3 p-2.5 bg-brand-dark hover:bg-brand-blue rounded-full transition-colors border border-brand-dark shadow-[0_10px_25px_rgba(20,56,84,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FaPaperPlane className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
