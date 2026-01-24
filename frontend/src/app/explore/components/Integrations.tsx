'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSlack, FaCog, FaTrash, FaTimes } from 'react-icons/fa';
import { useSlackHooks } from '../hooks/useSlackHooks';
import { SlackChannelModal } from '@/components/SlackChannelModal';
import { SlackWorkspace, getCategoryDisplayName, getCategoryColorClass } from '@/lib/slack';

// Helper function to render text with markdown-style bold (**text**)
const renderBoldText = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-semibold">
          {boldText}
        </strong>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export function Integrations() {
  const router = useRouter();
  const {
    workspaces,
    isLoadingWorkspaces,
    hooks,
    isLoadingHooks,
    error,
    refetchHooks,
    removeHook,
    disconnectWorkspace,
  } = useSlackHooks();

  const [selectedWorkspace, setSelectedWorkspace] = useState<SlackWorkspace | null>(null);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);

  const handleUseHook = (hookText: string) => {
    const encodedText = encodeURIComponent(hookText);
    router.push(`/create/edit?text=${encodedText}`);
  };

  const handleConnect = () => {
    router.push('/slack-connect');
  };

  const handleManageChannels = (workspace: SlackWorkspace) => {
    setSelectedWorkspace(workspace);
    setIsChannelModalOpen(true);
  };

  const handleDisconnect = async (workspaceId: string) => {
    if (confirm('Are you sure you want to disconnect this workspace? All generated hooks will be deleted.')) {
      await disconnectWorkspace(workspaceId);
    }
  };

  const isConnected = workspaces.length > 0;
  const isLoading = isLoadingWorkspaces || isLoadingHooks;

  return (
    <div className="animate-[fade-in_0.6s_ease-out]">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <FaSlack className="w-6 h-6 text-white/70" />
          <h2 className="text-2xl font-medium text-white">Slack Integration</h2>
        </div>
        <p className="text-white/60 text-sm">
          Internal company communications converted into LinkedIn-ready hooks
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => window.location.reload()} className="text-red-300 hover:text-red-100">
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !isConnected && (
        <div className="bg-brand-dark/30 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white/40 mx-auto mb-4"></div>
          <p className="text-white/60">Loading Slack integration...</p>
        </div>
      )}

      {/* Not connected state */}
      {!isLoading && !isConnected && (
        <div className="bg-brand-dark/30 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <FaSlack className="w-12 h-12 text-white/50" />
            <div>
              <h3 className="text-xl font-medium text-white mb-2">Connect Slack</h3>
              <p className="text-white/60 text-sm mb-6 max-w-md">
                Connect your Slack workspace to automatically generate LinkedIn post ideas from
                internal communications, team wins, and company announcements.
              </p>
              <button
                onClick={handleConnect}
                className="px-6 py-3 rounded-xl font-medium transition-colors bg-astro-sky text-astro-panel-dark hover:opacity-90"
              >
                Connect Slack Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connected state */}
      {!isLoading && isConnected && (
        <>
          {/* Workspace cards */}
          <div className="mb-8 space-y-3">
            {workspaces.map(workspace => (
              <div
                key={workspace.id}
                className="bg-brand-dark/30 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <FaSlack className="w-5 h-5 text-white/70" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{workspace.team_name}</h4>
                    <p className="text-white/50 text-xs">
                      Connected {formatRelativeTime(workspace.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleManageChannels(workspace)}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Manage channels"
                  >
                    <FaCog className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDisconnect(workspace.id)}
                    className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Disconnect"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Hooks section */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Generated Hooks</h3>
            <button
              onClick={() => handleConnect()}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              + Add workspace
            </button>
          </div>

          {hooks.length === 0 ? (
            <div className="bg-brand-dark/30 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
              <p className="text-white/60 mb-2">No hooks generated yet</p>
              <p className="text-white/40 text-sm">
                Enable channel monitoring to start generating LinkedIn hooks from your Slack messages.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hooks.map(hook => (
                <div
                  key={hook.id}
                  className="bg-brand-dark/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/40 transition-all duration-300 flex flex-col"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FaSlack className="w-4 h-4 text-white/50" />
                      <span className="text-xs text-white/50">
                        #{hook.channel_name || 'slack'}
                      </span>
                      {hook.category && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryColorClass(hook.category)}`}
                        >
                          {getCategoryDisplayName(hook.category)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40">
                        {formatRelativeTime(hook.created_at)}
                      </span>
                      <button
                        onClick={() => removeHook(hook.id)}
                        className="p-1 text-white/30 hover:text-red-400 transition-colors"
                        title="Delete hook"
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Source summary */}
                  {hook.source_summary && (
                    <p className="text-white/50 text-xs mb-3 italic">
                      {hook.source_summary}
                    </p>
                  )}

                  {/* Hook content */}
                  <div className="flex-1 mb-4 space-y-3">
                    {hook.hooks.map((hookText, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:border-astro-sky/50 hover:bg-astro-sky/5 transition-colors"
                        onClick={() => handleUseHook(hookText)}
                      >
                        <p className="text-white/90 text-sm leading-relaxed">
                          {renderBoldText(hookText)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Use first hook button */}
                  <button
                    onClick={() => handleUseHook(hook.hooks[0])}
                    className="w-full py-3 text-white rounded-lg text-sm font-medium transition-colors hover:opacity-90 bg-astro-sky"
                  >
                    Use Hook
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Load more */}
          {hooks.length >= 20 && (
            <div className="mt-6 text-center">
              <button
                onClick={refetchHooks}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}

      {/* Channel modal */}
      {selectedWorkspace && (
        <SlackChannelModal
          isOpen={isChannelModalOpen}
          onClose={() => {
            setIsChannelModalOpen(false);
            setSelectedWorkspace(null);
          }}
          workspace={selectedWorkspace}
          onUpdate={refetchHooks}
        />
      )}
    </div>
  );
}
