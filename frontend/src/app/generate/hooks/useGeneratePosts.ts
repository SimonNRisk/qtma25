import { useState } from 'react';
import { API_URL } from '@/lib/api';
import { session } from '@/lib/session';

export interface GeneratedPost {
  id: string;
  content: string;
  isBookmarked: boolean;
}

interface UseGeneratePostsOptions {
  quantity?: number;
  length?: number;
}

export const useGeneratePosts = (options: UseGeneratePostsOptions = {}) => {
  const { quantity = 5, length = 2 } = options;

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generatePosts = async (query: string) => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedPosts([]);

    try {
      const token = session.access();
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await fetch(`${API_URL}/api/linkedin/generate-posts`, {
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
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to generate posts: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.posts && Array.isArray(data.posts)) {
        // Convert posts array to objects with IDs
        const postsWithIds = data.posts.map((post: string, index: number) => ({
          id: `post-${Date.now()}-${index}`,
          content: post,
          isBookmarked: false,
        }));
        setGeneratedPosts(postsWithIds);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate posts';
      setError(errorMessage);
      console.error('Error generating posts:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const bookmarkPost = async (post: GeneratedPost) => {
    if (post.isBookmarked) {
      return;
    }

    try {
      const token = session.access();
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await fetch(`${API_URL}/api/linkedin/hooks/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hook: post.content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to bookmark: ${response.status}`);
      }

      // Update the post's bookmarked state
      setGeneratedPosts(prev =>
        prev.map(p => (p.id === post.id ? { ...p, isBookmarked: true } : p))
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bookmark post';
      setError(errorMessage);
      console.error('Error bookmarking post:', err);
    }
  };

  const copyToClipboard = async (postId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(postId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    // State
    isGenerating,
    error,
    generatedPosts,
    copiedId,
    // Actions
    generatePosts,
    bookmarkPost,
    copyToClipboard,
    clearError,
  };
};
