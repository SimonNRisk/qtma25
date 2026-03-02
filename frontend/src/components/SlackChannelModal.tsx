'use client';

import { useState, useEffect } from 'react';
import { FaSlack, FaLock, FaHashtag, FaTimes, FaSync } from 'react-icons/fa';
import {
  SlackChannel,
  SlackWorkspace,
  getSlackChannels,
  updateSlackChannels,
  refreshSlackChannels,
} from '@/lib/slack';

interface SlackChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: SlackWorkspace;
  onUpdate?: () => void;
}

// Recommended channel patterns for content generation
const RECOMMENDED_PATTERNS = [
  'general',
  'announcements',
  'product',
  'launches',
  'wins',
  'hiring',
  'team',
  'culture',
  'milestones',
  'customers',
  'success',
];

function isRecommendedChannel(channelName: string): boolean {
  const name = channelName.toLowerCase();
  return RECOMMENDED_PATTERNS.some(pattern => name.includes(pattern));
}

export function SlackChannelModal({
  isOpen,
  onClose,
  workspace,
  onUpdate,
}: SlackChannelModalProps) {
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (isOpen && workspace) {
      loadChannels();
    }
  }, [isOpen, workspace]);

  const loadChannels = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getSlackChannels(workspace.id);
      setChannels(data);
      setPendingChanges(new Map());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load channels');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError('');
    try {
      await refreshSlackChannels(workspace.id);
      await loadChannels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh channels');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggle = (channelId: string, currentEnabled: boolean) => {
    const newChanges = new Map(pendingChanges);
    const originalChannel = channels.find(c => c.channel_id === channelId);

    if (originalChannel) {
      const newValue = !currentEnabled;
      // If the new value is different from original, track the change
      if (newValue !== originalChannel.enabled) {
        newChanges.set(channelId, newValue);
      } else {
        // If we're reverting to original, remove from pending changes
        newChanges.delete(channelId);
      }
    }

    setPendingChanges(newChanges);
  };

  const getEffectiveEnabled = (channel: SlackChannel): boolean => {
    if (pendingChanges.has(channel.channel_id)) {
      return pendingChanges.get(channel.channel_id)!;
    }
    return channel.enabled;
  };

  const handleSave = async () => {
    if (pendingChanges.size === 0) {
      onClose();
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const updates = Array.from(pendingChanges.entries()).map(([channel_id, enabled]) => ({
        channel_id,
        enabled,
      }));

      await updateSlackChannels(workspace.id, updates);

      // Update local state
      setChannels(channels.map(ch => ({
        ...ch,
        enabled: pendingChanges.has(ch.channel_id)
          ? pendingChanges.get(ch.channel_id)!
          : ch.enabled,
      })));
      setPendingChanges(new Map());

      onUpdate?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const enabledCount = channels.filter(c => getEffectiveEnabled(c)).length;
  const hasChanges = pendingChanges.size > 0;

  // Sort channels: recommended first, then by name
  const sortedChannels = [...channels].sort((a, b) => {
    const aRecommended = isRecommendedChannel(a.channel_name);
    const bRecommended = isRecommendedChannel(b.channel_name);
    if (aRecommended && !bRecommended) return -1;
    if (!aRecommended && bRecommended) return 1;
    return a.channel_name.localeCompare(b.channel_name);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-astro-panel-dark border border-white/10 rounded-2xl shadow-2xl animate-[fade-in_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <FaSlack className="w-5 h-5 text-white/70" />
            <div>
              <h2 className="text-lg font-medium text-white">Manage Channels</h2>
              <p className="text-sm text-white/60">{workspace.team_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Info */}
          <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-sm text-white/70">
              Select channels to monitor for LinkedIn content ideas.
              <span className="text-green-400 ml-1">Recommended</span> channels often have
              post-worthy content.
            </p>
          </div>

          {/* Refresh button */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-white/60">
              {enabledCount} channel{enabledCount !== 1 ? 's' : ''} enabled
            </span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <FaSync className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Channel list */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-2 -mr-2">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white/40"></div>
              </div>
            ) : sortedChannels.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                No channels found
              </div>
            ) : (
              sortedChannels.map(channel => {
                const isEnabled = getEffectiveEnabled(channel);
                const isRecommended = isRecommendedChannel(channel.channel_name);

                return (
                  <div
                    key={channel.channel_id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                      isEnabled
                        ? 'bg-astro-sky/10 border-astro-sky/30'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                    onClick={() => handleToggle(channel.channel_id, isEnabled)}
                  >
                    <div className="flex items-center gap-3">
                      {channel.channel_type === 'private' ? (
                        <FaLock className="w-4 h-4 text-white/40" />
                      ) : (
                        <FaHashtag className="w-4 h-4 text-white/40" />
                      )}
                      <span className="text-white">{channel.channel_name}</span>
                      {isRecommended && (
                        <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div
                      className={`w-10 h-6 rounded-full p-1 transition-colors ${
                        isEnabled ? 'bg-astro-sky' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          isEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              hasChanges
                ? 'bg-astro-sky text-astro-panel-dark hover:opacity-90'
                : 'bg-white/10 text-white/60'
            } disabled:opacity-50`}
          >
            {isSaving ? 'Saving...' : hasChanges ? 'Save Changes' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
