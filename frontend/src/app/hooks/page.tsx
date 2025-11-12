'use client';

import { useCallback, useEffect, useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { session } from '@/lib/session';
import { getJSON } from '@/lib/api';

interface HookRecord {
  id: string;
  hooks: string[];
  hook_count: number;
  created_at: string;
  updated_at: string;
}

interface HooksResponse {
  success: boolean;
  data: HookRecord[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  };
}

interface FlattenedHook {
  id: string;
  content: string;
  recordId: string;
  createdAt: string;
}

type TabType = 'scheduled' | 'drafts' | 'sent';

export default function HooksPage() {
  // State
  const [flattenedHooks, setFlattenedHooks] = useState<FlattenedHook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('drafts');
  const [user, setUser] = useState<{
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null>(null);

  const fetchHooks = useCallback(async (offset: number = 0) => {
    const token = session.access();
    if (!token) {
      setError('Authentication required. Please log in.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = (await getJSON(
        `/api/linkedin/hooks?limit=50&offset=${offset}`,
        token
      )) as HooksResponse;

      if (response.success) {
        // Flatten hooks into individual cards
        const flattened: FlattenedHook[] = [];
        response.data.forEach(record => {
          record.hooks.forEach((hook, index) => {
            flattened.push({
              id: `${record.id}-${index}`,
              content: hook,
              recordId: record.id,
              createdAt: record.created_at,
            });
          });
        });
        setFlattenedHooks(flattened);
      } else {
        setError('Failed to load hooks');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retrieve hooks';
      setError(errorMessage);
      setFlattenedHooks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHooks(0);

    // Fetch user profile data
    const token = session.access();
    if (token) {
      getJSON('/me', token)
        .then((data: any) => {
          setUser(data.user);
        })
        .catch(err => {
          console.error('Failed to fetch user data:', err);
          // Fallback to JWT token data
          const jwtUser = session.getUser();
          if (jwtUser) {
            setUser(jwtUser);
          }
        });
    }
  }, [fetchHooks]);

  const getUserName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.first_name) {
      return user.first_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    // Fallback to JWT token if user state not loaded yet
    const jwtUser = session.getUser();
    if (jwtUser?.first_name && jwtUser?.last_name) {
      return `${jwtUser.first_name} ${jwtUser.last_name}`;
    }
    if (jwtUser?.first_name) {
      return jwtUser.first_name;
    }
    return 'User';
  };

  return (
    <AuthGuard>
      <div
        className="min-h-screen px-4 py-8 sm:px-6 lg:px-8"
        style={{
          background: 'var(--astro-hero-gradient)',
        }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Top Header */}
          <div className="flex items-center justify-between mb-8">
            {/* Profile Section */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-medium text-foreground">{getUserName()}</h1>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                List
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Calendar
              </button>
              <a
                href="/generate"
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Post
              </a>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-8 mb-6 border-b border-white/20">
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`pb-3 px-1 text-base font-normal transition-colors relative ${
                activeTab === 'scheduled'
                  ? 'text-foreground border-b-2 border-green-500'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Scheduled <span className="ml-2 text-sm bg-white/20 px-2 py-0.5 rounded-full">0</span>
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`pb-3 px-1 text-base font-normal transition-colors relative ${
                activeTab === 'drafts'
                  ? 'text-foreground border-b-2 border-green-500'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Drafts{' '}
              <span className="ml-2 text-sm bg-white/20 px-2 py-0.5 rounded-full">
                {flattenedHooks.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`pb-3 px-1 text-base font-normal transition-colors relative ${
                activeTab === 'sent'
                  ? 'text-foreground border-b-2 border-green-500'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Sent <span className="ml-2 text-sm bg-white/20 px-2 py-0.5 rounded-full">0</span>
            </button>
          </div>

          {/* Content Grid */}
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              <p className="mt-4 text-white/80">Loading your drafts...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Create New Card */}
              <a
                href="/generate"
                className="aspect-[4/5] rounded-xl border-2 border-dashed border-white/40 hover:border-white/60 flex flex-col items-center justify-center gap-6 transition-colors cursor-pointer group"
              >
                <div className="w-20 h-20 rounded-xl border-2 border-white/60 group-hover:border-white flex items-center justify-center transition-colors">
                  <svg
                    className="w-10 h-10 text-white/80 group-hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <p className="text-foreground text-2xl font-medium text-center px-8">
                  Create
                  <br />
                  something
                  <br />
                  new
                </p>
              </a>

              {/* Hook Cards */}
              {flattenedHooks.map(hook => (
                <div
                  key={hook.id}
                  className="aspect-[4/5] rounded-xl bg-white p-6 flex flex-col shadow-lg hover:shadow-xl transition-shadow"
                >
                  {/* Profile Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-gray-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{getUserName()}</div>
                      <div className="text-gray-500 text-xs">LinkedIn Header</div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto mb-4">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {hook.content}
                    </p>
                  </div>

                  {/* Edit Button */}
                  <button className="w-full py-3 bg-brand-dark hover:bg-brand-blue text-foreground font-medium rounded-lg transition-colors">
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 max-w-3xl mx-auto">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
