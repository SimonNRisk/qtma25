'use client';

import { useCallback, useEffect, useState } from 'react';
import { FaUser, FaBars, FaCalendar, FaPlus } from 'react-icons/fa';
import { AuthGuard } from '@/components/AuthGuard';
import { session } from '@/lib/session';
import { getJSON } from '@/lib/api';

import { getUserName } from './components/utils/utils';
import { HookCard } from './components/HookCard';

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

interface UserResponse {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    user_metadata: {
      first_name: string;
      last_name: string;
    };
  };
}

type TabType = 'repackage' | 'trending';

export default function HooksPage() {
  // State
  const [flattenedHooks, setFlattenedHooks] = useState<FlattenedHook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('repackage');
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
        `/api/hooks/get-user-hooks?limit=50&offset=${offset}`,
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
        .then((data: UserResponse) => {
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
                <FaUser className="w-8 h-8 text-gray-600" />
              </div>
              <h1 className="text-2xl font-medium text-foreground">{getUserName(user)}</h1>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg transition-colors">
                <FaBars className="w-5 h-5" />
                List
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg transition-colors">
                <FaCalendar className="w-5 h-5" />
                Calendar
              </button>
              <a
                href="/create/generate"
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg transition-colors"
              >
                <FaPlus className="w-5 h-5" />
                New Post
              </a>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-8 mb-6 border-b border-white/20">
            <button
              onClick={() => setActiveTab('repackage')}
              className={`pb-3 px-1 text-base font-normal transition-colors relative ${
                activeTab === 'repackage'
                  ? 'text-foreground border-b-2 border-green-500'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Repackage{' '}
              <span className="ml-2 text-sm bg-white/20 px-2 py-0.5 rounded-full">
                {flattenedHooks.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`pb-3 px-1 text-base font-normal transition-colors relative ${
                activeTab === 'trending'
                  ? 'text-foreground border-b-2 border-green-500'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Trending <span className="ml-2 text-sm bg-white/20 px-2 py-0.5 rounded-full">0</span>
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
                href="/create/generate"
                className="aspect-[4/5] rounded-xl border-2 border-dashed border-white/40 hover:border-white/60 flex flex-col items-center justify-center gap-6 transition-colors cursor-pointer group"
              >
                <div className="w-20 h-20 rounded-xl border-2 border-white/60 group-hover:border-white flex items-center justify-center transition-colors">
                  <FaPlus className="w-10 h-10 text-white/80 group-hover:text-white transition-colors" />
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
                <HookCard key={hook.id} hook={hook} user={user} />
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
