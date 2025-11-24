import { API_URL } from '@/lib/api';
import { session } from '@/lib/session';
import { useState, useEffect } from 'react';

interface NewsHook {
  id: string;
  industry: string;
  industry_slug: string;
  summary: string;
  hooks: string[];
  created_at: string;
}

interface NewsHooksResponse {
  success: boolean;
  data: NewsHook[];
  count: number;
}

export const useGetNewsHooks = (industrySlug?: string, createdAfter?: string) => {
  const [newsHooks, setNewsHooks] = useState<NewsHook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewsHooks = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get access token for authentication
        const accessToken = session.access();
        if (!accessToken) {
          throw new Error('Not authenticated');
        }

        // Build query params
        const params = new URLSearchParams();
        if (industrySlug) {
          params.append('industry_slug', industrySlug);
        }
        if (createdAfter) {
          params.append('created_after', createdAfter);
        }

        const response = await fetch(`${API_URL}/api/news/hooks?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch news hooks: ${response.statusText}`);
        }

        const data: NewsHooksResponse = await response.json();
        setNewsHooks(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch news hooks');
        setNewsHooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNewsHooks();
  }, [industrySlug, createdAfter]); // Re-fetch if industrySlug or createdAfter changes

  return { newsHooks, loading, error };
};
