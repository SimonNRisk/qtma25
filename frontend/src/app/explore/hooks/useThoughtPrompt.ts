/**
 * Hook for fetching the current thought prompt
 * 
 * Fetches the most recent active thought prompt and indicates
 * whether the current user has already responded.
 */

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import { session } from '@/lib/session';

export interface ThoughtPrompt {
  id: string;
  question: string;
  created_at: string;
}

interface GetPromptResponse {
  success: boolean;
  data: ThoughtPrompt | null;
  has_responded: boolean;
  existing_response: string | null;
}

interface UseThoughtPromptReturn {
  prompt: ThoughtPrompt | null;
  hasResponded: boolean;
  existingResponse: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  fetchRandom: () => Promise<void>;
}

export const useThoughtPrompt = (): UseThoughtPromptReturn => {
  const [prompt, setPrompt] = useState<ThoughtPrompt | null>(null);
  const [hasResponded, setHasResponded] = useState(false);
  const [existingResponse, setExistingResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompt = useCallback(async (endpoint: 'current' | 'random' = 'current') => {
    try {
      setLoading(true);
      setError(null);

      const accessToken = session.access();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/thought-prompts/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch thought prompt: ${response.statusText}`);
      }

      const data: GetPromptResponse = await response.json();
      
      setPrompt(data.data);
      setHasResponded(data.has_responded);
      setExistingResponse(data.existing_response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch thought prompt';
      setError(errorMessage);
      console.error('Error fetching thought prompt:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchPrompt('current');
  }, [fetchPrompt]);

  const fetchRandom = useCallback(async () => {
    await fetchPrompt('random');
  }, [fetchPrompt]);

  useEffect(() => {
    fetchPrompt('current');
  }, [fetchPrompt]);

  return {
    prompt,
    hasResponded,
    existingResponse,
    loading,
    error,
    refetch,
    fetchRandom,
  };
};

