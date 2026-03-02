'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  SlackHook,
  SlackWorkspace,
  getSlackHooks,
  getSlackWorkspaces,
  deleteSlackHook,
  deleteSlackWorkspace,
} from '@/lib/slack';

interface UseSlackHooksResult {
  // Workspaces
  workspaces: SlackWorkspace[];
  isLoadingWorkspaces: boolean;

  // Hooks
  hooks: SlackHook[];
  isLoadingHooks: boolean;

  // Errors
  error: string | null;

  // Actions
  refetchWorkspaces: () => Promise<void>;
  refetchHooks: () => Promise<void>;
  removeHook: (hookId: string) => Promise<void>;
  disconnectWorkspace: (workspaceId: string) => Promise<void>;
}

export function useSlackHooks(): UseSlackHooksResult {
  // Workspaces state
  const [workspaces, setWorkspaces] = useState<SlackWorkspace[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);

  // Hooks state
  const [hooks, setHooks] = useState<SlackHook[]>([]);
  const [isLoadingHooks, setIsLoadingHooks] = useState(true);

  // Error state
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    setIsLoadingWorkspaces(true);
    setError(null);
    try {
      const data = await getSlackWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspaces');
    } finally {
      setIsLoadingWorkspaces(false);
    }
  }, []);

  const fetchHooks = useCallback(async () => {
    setIsLoadingHooks(true);
    setError(null);
    try {
      const response = await getSlackHooks(20, 0);
      setHooks(response.data || []);
    } catch (err) {
      // Don't show error if user just isn't connected
      if (err instanceof Error && !err.message.includes('not available')) {
        setError(err.message);
      }
      setHooks([]);
    } finally {
      setIsLoadingHooks(false);
    }
  }, []);

  const removeHook = useCallback(async (hookId: string) => {
    try {
      await deleteSlackHook(hookId);
      setHooks(prev => prev.filter(h => h.id !== hookId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete hook');
    }
  }, []);

  const disconnectWorkspace = useCallback(async (workspaceId: string) => {
    try {
      await deleteSlackWorkspace(workspaceId);
      setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
      // Also clear hooks since they're associated with the workspace
      await fetchHooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect workspace');
    }
  }, [fetchHooks]);

  // Initial load
  useEffect(() => {
    fetchWorkspaces();
    fetchHooks();
  }, [fetchWorkspaces, fetchHooks]);

  return {
    workspaces,
    isLoadingWorkspaces,
    hooks,
    isLoadingHooks,
    error,
    refetchWorkspaces: fetchWorkspaces,
    refetchHooks: fetchHooks,
    removeHook,
    disconnectWorkspace,
  };
}
