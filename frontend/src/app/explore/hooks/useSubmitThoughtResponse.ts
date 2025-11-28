/**
 * Hook for submitting responses to thought prompts
 * 
 * Handles submitting new responses and updating existing ones.
 */

import { useState, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import { session } from '@/lib/session';

export interface ThoughtPromptResponse {
  id: string;
  thought_prompt_id: string;
  user_id: string;
  response: string;
  created_at: string;
  updated_at: string;
  question?: string;
}

interface SubmitResponseResult {
  success: boolean;
  message: string;
  data: ThoughtPromptResponse | null;
}

interface UseSubmitThoughtResponseReturn {
  submitResponse: (thoughtPromptId: string, response: string) => Promise<ThoughtPromptResponse | null>;
  isSubmitting: boolean;
  error: string | null;
  lastSubmittedResponse: ThoughtPromptResponse | null;
  clearError: () => void;
}

export const useSubmitThoughtResponse = (): UseSubmitThoughtResponseReturn => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmittedResponse, setLastSubmittedResponse] = useState<ThoughtPromptResponse | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const submitResponse = useCallback(async (
    thoughtPromptId: string,
    response: string
  ): Promise<ThoughtPromptResponse | null> => {
    // Validate inputs
    if (!thoughtPromptId) {
      setError('Thought prompt ID is required');
      return null;
    }

    const trimmedResponse = response.trim();
    if (!trimmedResponse) {
      setError('Response cannot be empty');
      return null;
    }

    if (trimmedResponse.length > 5000) {
      setError('Response must be 5000 characters or less');
      return null;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const accessToken = session.access();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const res = await fetch(`${API_URL}/api/thought-prompts/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          thought_prompt_id: thoughtPromptId,
          response: trimmedResponse,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to submit response: ${res.statusText}`);
      }

      const result: SubmitResponseResult = await res.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to submit response');
      }

      setLastSubmittedResponse(result.data);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit response';
      setError(errorMessage);
      console.error('Error submitting thought response:', err);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    submitResponse,
    isSubmitting,
    error,
    lastSubmittedResponse,
    clearError,
  };
};

