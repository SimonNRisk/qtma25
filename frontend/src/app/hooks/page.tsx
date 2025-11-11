'use client';

import { useCallback, useEffect, useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { session } from '@/lib/session';
import { getJSON } from '@/lib/api';

interface HookRecord {
  id: string;
  hooks: string[];
  generation_params: {
    quantity?: number;
    context?: string;
    length?: number;
    tone?: string;
    audience?: string;
  };
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

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

function getLengthLabel(length?: number): string {
  const labels = { 1: 'Short', 2: 'Medium', 3: 'Long' };
  return length ? labels[length as keyof typeof labels] || 'Unknown' : 'N/A';
}

export default function HooksPage() {
  // State
  const [records, setRecords] = useState<HookRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [copiedHook, setCopiedHook] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    total: 0,
    has_more: false,
  });

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
        `/api/linkedin/hooks?limit=10&offset=${offset}`,
        token
      )) as HooksResponse;

      if (response.success) {
        setRecords(response.data);
        setPagination(response.pagination);
      } else {
        setError('Failed to load hooks');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to retrieve hooks';
      setError(errorMessage);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHooks(0);
  }, [fetchHooks]);


  const handleCopyHook = useCallback(async (hook: string, hookId: string) => {
    try {
      await navigator.clipboard.writeText(hook);
      setCopiedHook(hookId);
      setTimeout(() => setCopiedHook(null), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }, []);

  const toggleExpanded = useCallback((recordId: string) => {
    setExpandedRecord((prev) => (prev === recordId ? null : recordId));
  }, []);

  const handlePrevPage = useCallback(() => {
    const newOffset = Math.max(0, pagination.offset - pagination.limit);
    fetchHooks(newOffset);
  }, [pagination, fetchHooks]);

  const handleNextPage = useCallback(() => {
    if (pagination.has_more) {
      const newOffset = pagination.offset + pagination.limit;
      fetchHooks(newOffset);
    }
  }, [pagination, fetchHooks]);

  const handleRefresh = useCallback(() => {
    fetchHooks(pagination.offset);
  }, [fetchHooks, pagination.offset]);

  const renderEmptyState = () => (
    <div className="text-center py-16 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
        <svg
          className="w-8 h-8 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No hooks generated yet
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Start by generating LinkedIn post hooks. They'll appear here automatically
        so you can access them anytime.
      </p>
      <a
        href="/generate"
        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        Generate Hooks
        <svg
          className="ml-2 w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </a>
    </div>
  );

  const renderLoadingState = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="h-8 w-24 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderHookCard = (record: HookRecord) => {
    const isExpanded = expandedRecord === record.id;
    const displayHooks = isExpanded ? record.hooks : record.hooks.slice(0, 3);

    return (
      <div
        key={record.id}
        className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {record.hook_count} Hooks Generated
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getLengthLabel(record.generation_params?.length)}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {formatRelativeTime(record.created_at)}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>

          {/* Generation Parameters */}
          {record.generation_params && (
            <div className="mt-4 flex flex-wrap gap-2">
              {record.generation_params.tone && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                  <span className="font-medium mr-1">Tone:</span>
                  {record.generation_params.tone}
                </span>
              )}
              {record.generation_params.audience && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                  <span className="font-medium mr-1">Audience:</span>
                  {record.generation_params.audience}
                </span>
              )}
              {record.generation_params.quantity && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                  <span className="font-medium mr-1">Requested:</span>
                  {record.generation_params.quantity}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Hooks List */}
        <div className="p-6">
          <div className="space-y-4">
            {displayHooks.map((hook, index) => {
              const hookId = `${record.id}-${index}`;
              const isCopied = copiedHook === hookId;

              return (
                <div
                  key={index}
                  className="group relative bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold">
                      {index + 1}
                    </span>
                    <p className="flex-1 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {hook}
                    </p>
                    <button
                      onClick={() => handleCopyHook(hook, hookId)}
                      className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                      title="Copy to clipboard"
                    >
                      {isCopied ? (
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show More/Less Button */}
          {record.hooks.length > 3 && (
            <button
              onClick={() => toggleExpanded(record.id)}
              className="mt-4 w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {isExpanded
                ? 'Show Less'
                : `Show ${record.hooks.length - 3} More Hooks`}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Your LinkedIn Hooks
                </h1>
                <p className="text-gray-600">
                  All your generated hooks in one place. Copy and use them anytime.
                </p>
              </div>
            </div>

            {/* Stats Bar */}
            {!isLoading && records.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Total generations: <strong>{pagination.total}</strong>
                  </span>
                  <span className="text-gray-600">
                    Showing {pagination.offset + 1} -{' '}
                    {Math.min(
                      pagination.offset + pagination.limit,
                      pagination.total
                    )}{' '}
                    of {pagination.total}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-red-600 mt-0.5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            renderLoadingState()
          ) : records.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <div className="space-y-6 mb-8">
                {records.map((record) => renderHookCard(record))}
              </div>

              {/* Pagination */}
              {pagination.total > pagination.limit && (
                <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
                  <button
                    onClick={handlePrevPage}
                    disabled={pagination.offset === 0}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page{' '}
                    {Math.floor(pagination.offset / pagination.limit) + 1} of{' '}
                    {Math.ceil(pagination.total / pagination.limit)}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={!pagination.has_more}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

