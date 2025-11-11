-- ============================================================================
-- LinkedIn Generated Hooks Storage Schema
-- ============================================================================
-- This table stores AI-generated LinkedIn post hooks for authenticated users.
-- Each user can have multiple generations stored with full audit trail.
-- ============================================================================

-- Create the main table
CREATE TABLE IF NOT EXISTS linkedin_generated_hooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Hook content and metadata
    hooks JSONB NOT NULL,
    generation_params JSONB DEFAULT '{}'::jsonb,
    
    -- Statistics
    hook_count INTEGER NOT NULL DEFAULT 0,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT hooks_not_empty CHECK (jsonb_array_length(hooks) > 0),
    CONSTRAINT hook_count_matches CHECK (hook_count = jsonb_array_length(hooks))
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Primary lookup by user_id (most common query)
CREATE INDEX IF NOT EXISTS idx_linkedin_hooks_user_id 
    ON linkedin_generated_hooks(user_id);

-- Sort by creation date (for pagination)
CREATE INDEX IF NOT EXISTS idx_linkedin_hooks_created_at 
    ON linkedin_generated_hooks(created_at DESC);

-- Composite index for user + date queries
CREATE INDEX IF NOT EXISTS idx_linkedin_hooks_user_created 
    ON linkedin_generated_hooks(user_id, created_at DESC);

-- GIN index for JSONB queries (if we need to search within hooks)
CREATE INDEX IF NOT EXISTS idx_linkedin_hooks_content 
    ON linkedin_generated_hooks USING GIN (hooks);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE linkedin_generated_hooks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own hooks
CREATE POLICY "Users can view their own hooks"
    ON linkedin_generated_hooks
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own hooks
CREATE POLICY "Users can insert their own hooks"
    ON linkedin_generated_hooks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own hooks
CREATE POLICY "Users can update their own hooks"
    ON linkedin_generated_hooks
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own hooks
CREATE POLICY "Users can delete their own hooks"
    ON linkedin_generated_hooks
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- Triggers for Automatic Timestamp Management
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_linkedin_hooks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
DROP TRIGGER IF EXISTS trg_update_linkedin_hooks_timestamp ON linkedin_generated_hooks;
CREATE TRIGGER trg_update_linkedin_hooks_timestamp
    BEFORE UPDATE ON linkedin_generated_hooks
    FOR EACH ROW
    EXECUTE FUNCTION update_linkedin_hooks_timestamp();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get user's latest hooks
CREATE OR REPLACE FUNCTION get_latest_hooks(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    hooks JSONB,
    generation_params JSONB,
    hook_count INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.hooks,
        h.generation_params,
        h.hook_count,
        h.created_at,
        h.updated_at
    FROM linkedin_generated_hooks h
    WHERE h.user_id = p_user_id
    ORDER BY h.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_latest_hooks(UUID, INTEGER) TO authenticated;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE linkedin_generated_hooks IS 'Stores AI-generated LinkedIn post hooks for users';
COMMENT ON COLUMN linkedin_generated_hooks.hooks IS 'JSONB array of generated hook strings';
COMMENT ON COLUMN linkedin_generated_hooks.generation_params IS 'Parameters used for generation (quantity, length, tone, etc.)';
COMMENT ON COLUMN linkedin_generated_hooks.hook_count IS 'Cached count of hooks for quick queries';
COMMENT ON COLUMN linkedin_generated_hooks.created_at IS 'Timestamp when hooks were first generated';
COMMENT ON COLUMN linkedin_generated_hooks.updated_at IS 'Timestamp of last modification';

