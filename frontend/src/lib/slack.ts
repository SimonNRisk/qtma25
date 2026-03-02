/**
 * Slack API utilities for the frontend
 */

import { API_URL, getJSON, postJSON } from './api';

// ==================== Types ====================

export interface SlackWorkspace {
  id: string;
  workspace_id: string;
  team_name: string;
  created_at: string;
  updated_at?: string;
}

export interface SlackChannel {
  id: string;
  channel_id: string;
  channel_name: string;
  channel_type: 'public' | 'private';
  enabled: boolean;
}

export interface SlackHook {
  id: string;
  hooks: string[];
  category?: string;
  source_summary?: string;
  channel_name?: string;
  created_at: string;
}

export interface ChannelUpdate {
  channel_id: string;
  enabled: boolean;
}

// ==================== API Functions ====================

/**
 * Get Slack OAuth URL for workspace installation
 */
export async function getSlackAuthUrl(): Promise<{ auth_url: string; state: string }> {
  const response = await fetch(`${API_URL}/api/slack/oauth`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get Slack auth URL');
  }

  return response.json();
}

/**
 * Complete Slack OAuth callback
 */
export async function completeSlackOAuth(
  code: string,
  state: string
): Promise<{ success: boolean; workspace: SlackWorkspace }> {
  return postJSON('/api/slack/oauth/callback', { code, state });
}

/**
 * Get all connected Slack workspaces
 */
export async function getSlackWorkspaces(): Promise<SlackWorkspace[]> {
  const response = await getJSON('/api/slack/workspaces');
  return response.workspaces || [];
}

/**
 * Delete (disconnect) a Slack workspace
 */
export async function deleteSlackWorkspace(workspaceId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/slack/workspaces/${workspaceId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to disconnect workspace');
  }
}

/**
 * Get channels for a workspace
 */
export async function getSlackChannels(workspaceId: string): Promise<SlackChannel[]> {
  const response = await getJSON(`/api/slack/channels?workspace_id=${workspaceId}`);
  return response.channels || [];
}

/**
 * Refresh channels from Slack API
 */
export async function refreshSlackChannels(
  workspaceId: string
): Promise<{ success: boolean; channel_count: number }> {
  return postJSON(`/api/slack/channels/refresh?workspace_id=${workspaceId}`, {});
}

/**
 * Update channel monitoring status
 */
export async function updateSlackChannels(
  workspaceId: string,
  channels: ChannelUpdate[]
): Promise<{ success: boolean; updated_count: number }> {
  return postJSON('/api/slack/channels', {
    workspace_id: workspaceId,
    channels,
  });
}

/**
 * Get Slack-generated hooks
 */
export async function getSlackHooks(
  limit: number = 20,
  offset: number = 0,
  category?: string
): Promise<{ success: boolean; data: SlackHook[]; count: number }> {
  let url = `/api/slack/hooks?limit=${limit}&offset=${offset}`;
  if (category) {
    url += `&category=${encodeURIComponent(category)}`;
  }
  return getJSON(url);
}

/**
 * Delete a Slack hook
 */
export async function deleteSlackHook(hookId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/slack/hooks/${hookId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete hook');
  }
}

// ==================== Utility Functions ====================

/**
 * Get display name for a category
 */
export function getCategoryDisplayName(category?: string): string {
  const categoryMap: Record<string, string> = {
    hiring: 'Hiring',
    product_launch: 'Product Launch',
    milestone: 'Milestone',
    culture: 'Culture',
    customer_success: 'Customer Success',
    thought_leadership: 'Thought Leadership',
    behind_the_scenes: 'Behind the Scenes',
  };

  return category ? categoryMap[category] || category : 'General';
}

/**
 * Get color class for a category badge
 */
export function getCategoryColorClass(category?: string): string {
  const colorMap: Record<string, string> = {
    hiring: 'bg-green-500/20 text-green-400 border-green-500/30',
    product_launch: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    milestone: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    culture: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    customer_success: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    thought_leadership: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    behind_the_scenes: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  };

  return category ? colorMap[category] || 'bg-white/10 text-white/70 border-white/20' : 'bg-white/10 text-white/70 border-white/20';
}
