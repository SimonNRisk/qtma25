import { useState, useCallback, useRef } from 'react';
import { API_URL } from '@/lib/api';
import { session } from '@/lib/session';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface StreamingHook {
  id: string;
  content: string;
  index: number;
  isBookmarked: boolean;
}

interface UseStreamingGenerateOptions {
  quantity?: number;
  length?: number;
}

export const useStreamingGenerate = (options: UseStreamingGenerateOptions = {}) => {
  const { quantity = 5, length = 2 } = options;

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hooks, setHooks] = useState<StreamingHook[]>([]);
  const [currentStreamingContent, setCurrentStreamingContent] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generatePosts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    setIsGenerating(true);
    setError(null);
    setCurrentStreamingContent('');
    setHooks([]);
    // Note: We keep messages to maintain conversation history

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const token = session.access();
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await fetch(`${API_URL}/api/openai/generate-posts-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity,
          context: query.trim(),
          length,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to generate posts: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';
      let conversationMessageId: string | null = null;
      let hookStreamingMessageId: string | null = null;
      let conversationAdded = false;
      let hookCounter = 0;
      let currentHookStreamingContent = ''; // Track content for current hook only

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        // SSE format: "data: {...}\n\n"
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event in buffer

        for (const event of events) {
          if (!event.trim()) continue;
          
          const lines = event.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'conversation') {
                  // Complete conversational response - update existing or create new
                  if (!conversationMessageId) {
                    conversationMessageId = `conversation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                  }
                  
                  setMessages(prev => {
                    const existingIndex = prev.findIndex(m => m.id === conversationMessageId);
                    if (existingIndex >= 0) {
                      // Update existing conversation message
                      const updated = [...prev];
                      updated[existingIndex] = {
                        ...updated[existingIndex],
                        content: data.content, // Replace with complete conversation
                      };
                      return updated;
                    } else {
                      // Create new conversation message
                      return [...prev, {
                        id: conversationMessageId!,
                        role: 'assistant',
                        content: data.content,
                        timestamp: new Date(),
                      }];
                    }
                  });
                  conversationAdded = true;
                } else if (data.type === 'chunk') {
                  // Determine if this chunk is conversation or hook content
                  const isHookChunk = data.section === 'hook';
                  const isConversationChunk = data.section === 'conversation';
                  
                  if (isConversationChunk) {
                    // Update conversation message with streaming content
                    if (!conversationMessageId) {
                      conversationMessageId = `conversation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    }
                    
                    setMessages(prev => {
                      const existingIndex = prev.findIndex(m => m.id === conversationMessageId);
                      if (existingIndex >= 0) {
                        const updated = [...prev];
                        updated[existingIndex] = {
                          ...updated[existingIndex],
                          content: updated[existingIndex].content + data.content,
                        };
                        return updated;
                      } else {
                        return [...prev, {
                          id: conversationMessageId!,
                          role: 'assistant',
                          content: data.content,
                          timestamp: new Date(),
                        }];
                      }
                    });
                    conversationAdded = true;
                  } else if (isHookChunk) {
                    // Accumulate content for current hook only
                    currentHookStreamingContent += data.content;
                    setCurrentStreamingContent(currentHookStreamingContent);
                    
                    // Create or update hook streaming message (separate from conversation)
                    if (!hookStreamingMessageId) {
                      hookStreamingMessageId = `hook-streaming-${Date.now()}-${Math.random()}`;
                    }
                    
                    setMessages(prev => {
                      const existingIndex = prev.findIndex(m => m.id === hookStreamingMessageId);
                      if (existingIndex >= 0) {
                        const updated = [...prev];
                        updated[existingIndex] = {
                          ...updated[existingIndex],
                          content: currentHookStreamingContent,
                        };
                        return updated;
                      } else {
                        return [...prev, {
                          id: hookStreamingMessageId!,
                          role: 'assistant',
                          content: currentHookStreamingContent,
                          timestamp: new Date(),
                        }];
                      }
                    });
                  }
                } else if (data.type === 'hook') {
                  // A complete hook has been generated
                  hookCounter++;
                  const uniqueId = `hook-${Date.now()}-${data.index}-${hookCounter}-${Math.random().toString(36).substr(2, 9)}`;
                  const newHook: StreamingHook = {
                    id: uniqueId,
                    content: data.content,
                    index: data.index,
                    isBookmarked: false,
                  };
                  setHooks(prev => [...prev, newHook]);
                  
                  // Remove the streaming message for this hook and clear streaming content
                  currentHookStreamingContent = ''; // Reset for next hook
                  setCurrentStreamingContent('');
                  setMessages(prev => {
                    if (hookStreamingMessageId) {
                      return prev.filter(m => m.id !== hookStreamingMessageId);
                    }
                    return prev;
                  });
                  
                  // Reset for next hook
                  hookStreamingMessageId = null;
                } else if (data.type === 'complete') {
                  // Generation complete - clean up any remaining streaming message
                  currentHookStreamingContent = '';
                  setCurrentStreamingContent('');
                  setMessages(prev => {
                    if (hookStreamingMessageId) {
                      return prev.filter(m => m.id !== hookStreamingMessageId);
                    }
                    return prev;
                  });
                  setIsGenerating(false);
                } else if (data.type === 'error') {
                  throw new Error(data.message);
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
              break; // Process only first data line per event
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled, don't show error
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate posts';
      setError(errorMessage);
      console.error('Error generating posts:', err);
    } finally {
      setIsGenerating(false);
      setCurrentStreamingContent('');
    }
  }, [quantity, length]);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setCurrentStreamingContent('');
  }, []);

  const bookmarkHook = async (hookId: string) => {
    const hook = hooks.find(h => h.id === hookId);
    if (!hook || hook.isBookmarked) {
      return;
    }

    try {
      const token = session.access();
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await fetch(`${API_URL}/api/hooks/bookmark-hook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hook: hook.content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to bookmark: ${response.status}`);
      }

      setHooks(prev =>
        prev.map(h => (h.id === hookId ? { ...h, isBookmarked: true } : h))
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bookmark hook';
      setError(errorMessage);
      console.error('Error bookmarking hook:', err);
    }
  };

  const copyToClipboard = async (hookId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(hookId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const editMessage = useCallback((messageId: string, newContent: string) => {
    setMessages(prev =>
      prev.map(msg => (msg.id === messageId ? { ...msg, content: newContent } : msg))
    );
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setHooks([]);
    setError(null);
  }, []);

  return {
    // State
    isGenerating,
    error,
    messages,
    hooks,
    currentStreamingContent,
    copiedId,
    // Actions
    generatePosts,
    cancelGeneration,
    bookmarkHook,
    copyToClipboard,
    editMessage,
    clearMessages,
  };
};

