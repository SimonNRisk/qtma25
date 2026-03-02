-- Slack Integration Tables
-- Run this migration in Supabase SQL Editor

-- slack_workspaces: Store Slack workspace connections
CREATE TABLE IF NOT EXISTS slack_workspaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Workspace identification
    workspace_id TEXT NOT NULL,           -- Slack team_id
    team_name TEXT NOT NULL,              -- Slack team_name

    -- Bot token (encrypted at rest by Supabase)
    bot_token TEXT NOT NULL,
    bot_user_id TEXT,                     -- Bot's user ID in the workspace

    -- User association
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- OAuth metadata
    scope TEXT,                           -- Granted scopes

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints: One connection per user per workspace
    UNIQUE(workspace_id, user_id)
);

-- slack_channels: Store monitored channels for each workspace
CREATE TABLE IF NOT EXISTS slack_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Foreign key to workspace
    workspace_id UUID NOT NULL REFERENCES slack_workspaces(id) ON DELETE CASCADE,

    -- Channel identification
    channel_id TEXT NOT NULL,             -- Slack channel ID
    channel_name TEXT NOT NULL,           -- Channel name (without #)
    channel_type TEXT DEFAULT 'public',   -- 'public' or 'private'

    -- Monitoring status
    enabled BOOLEAN DEFAULT false,        -- Whether to monitor this channel

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(workspace_id, channel_id)
);

-- slack_hooks: Store generated hooks from Slack messages
CREATE TABLE IF NOT EXISTS slack_hooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- User and source association
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES slack_workspaces(id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL,

    -- Generated content
    hooks JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Categorization
    category TEXT,                        -- 'hiring', 'product_launch', 'milestone', 'culture', 'customer_success', 'thought_leadership'

    -- Source context (for reference, not stored full message for privacy)
    source_summary TEXT,                  -- Brief summary of what triggered the hook
    message_ts TEXT,                      -- Slack message timestamp (for deduplication)

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_hooks_array CHECK (jsonb_typeof(hooks) = 'array')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_slack_workspaces_user_id ON slack_workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_slack_workspaces_workspace_id ON slack_workspaces(workspace_id);
CREATE INDEX IF NOT EXISTS idx_slack_channels_workspace_id ON slack_channels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_slack_channels_enabled ON slack_channels(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_slack_hooks_user_id ON slack_hooks(user_id);
CREATE INDEX IF NOT EXISTS idx_slack_hooks_created_at ON slack_hooks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_slack_hooks_category ON slack_hooks(category);
CREATE INDEX IF NOT EXISTS idx_slack_hooks_message_ts ON slack_hooks(workspace_id, message_ts);

-- Row Level Security (RLS)
ALTER TABLE slack_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_hooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only view their own data
CREATE POLICY "Users can view their own workspaces" ON slack_workspaces
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view channels of their workspaces" ON slack_channels
    FOR SELECT USING (
        workspace_id IN (
            SELECT id FROM slack_workspaces WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own slack hooks" ON slack_hooks
    FOR SELECT USING (auth.uid() = user_id);
