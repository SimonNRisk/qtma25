-- This adds the hook_count column, indexes, RLS policies, triggers, and functions
-- that are expected by the backend code.


-- Add missing column
ALTER TABLE public.linkedin_generated_hooks 
ADD COLUMN IF NOT EXISTS hook_count INTEGER NOT NULL DEFAULT 0;

-- Update existing records to set hook_count based on hooks array length
UPDATE public.linkedin_generated_hooks 
SET hook_count = jsonb_array_length(hooks)
WHERE hook_count = 0;

-- Add constraints
DO $$ 
BEGIN
    -- Check if constraint exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'hooks_not_empty'
    ) THEN
        ALTER TABLE public.linkedin_generated_hooks 
        ADD CONSTRAINT hooks_not_empty CHECK (jsonb_array_length(hooks) > 0);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'hook_count_matches'
    ) THEN
        ALTER TABLE public.linkedin_generated_hooks 
        ADD CONSTRAINT hook_count_matches CHECK (hook_count = jsonb_array_length(hooks));
    END IF;
END $$;


-- Indexes for Performance
-- 

-- Primary lookup by user_id (most common query)
CREATE INDEX IF NOT EXISTS idx_linkedin_hooks_user_id 
    ON public.linkedin_generated_hooks(user_id);

-- Sort by creation date (for pagination)
CREATE INDEX IF NOT EXISTS idx_linkedin_hooks_created_at 
    ON public.linkedin_generated_hooks(created_at DESC);

-- Composite index for user + date queries
CREATE INDEX IF NOT EXISTS idx_linkedin_hooks_user_created 
    ON public.linkedin_generated_hooks(user_id, created_at DESC);

-- GIN index for JSONB queries (if we need to search within hooks)
CREATE INDEX IF NOT EXISTS idx_linkedin_hooks_content 
    ON public.linkedin_generated_hooks USING GIN (hooks);

-- Row Level Security (RLS)

-- Enable RLS
ALTER TABLE public.linkedin_generated_hooks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own hooks" ON public.linkedin_generated_hooks;
DROP POLICY IF EXISTS "Users can insert their own hooks" ON public.linkedin_generated_hooks;
DROP POLICY IF EXISTS "Users can update their own hooks" ON public.linkedin_generated_hooks;
DROP POLICY IF EXISTS "Users can delete their own hooks" ON public.linkedin_generated_hooks;

-- Policy: Users can view only their own hooks
CREATE POLICY "Users can view their own hooks"
    ON public.linkedin_generated_hooks
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own hooks
CREATE POLICY "Users can insert their own hooks"
    ON public.linkedin_generated_hooks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own hooks
CREATE POLICY "Users can update their own hooks"
    ON public.linkedin_generated_hooks
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own hooks
CREATE POLICY "Users can delete their own hooks"
    ON public.linkedin_generated_hooks
    FOR DELETE
    USING (auth.uid() = user_id);
-- Triggers for Automatic Timestamp Management

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_linkedin_hooks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
DROP TRIGGER IF EXISTS trg_update_linkedin_hooks_timestamp ON public.linkedin_generated_hooks;
CREATE TRIGGER trg_update_linkedin_hooks_timestamp
    BEFORE UPDATE ON public.linkedin_generated_hooks
    FOR EACH ROW
    EXECUTE FUNCTION update_linkedin_hooks_timestamp();


-- Helper Functions

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
    FROM public.linkedin_generated_hooks h
    WHERE h.user_id = p_user_id
    ORDER BY h.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_latest_hooks(UUID, INTEGER) TO authenticated;


-- Comments for Documentation

COMMENT ON TABLE public.linkedin_generated_hooks IS 'Stores AI-generated LinkedIn post hooks for users';
COMMENT ON COLUMN public.linkedin_generated_hooks.hooks IS 'JSONB array of generated hook strings';
COMMENT ON COLUMN public.linkedin_generated_hooks.generation_params IS 'Parameters used for generation (quantity, length, tone, etc.)';
COMMENT ON COLUMN public.linkedin_generated_hooks.hook_count IS 'Cached count of hooks for quick queries';
COMMENT ON COLUMN public.linkedin_generated_hooks.created_at IS 'Timestamp when hooks were first generated';
COMMENT ON COLUMN public.linkedin_generated_hooks.updated_at IS 'Timestamp of last modification';
