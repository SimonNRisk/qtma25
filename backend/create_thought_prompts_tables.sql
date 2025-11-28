-- ============================================================================
-- THOUGHT PROMPTS TABLES
-- ============================================================================
-- Two tables:
-- 1. thought_prompts: Stores the thought prompt questions
-- 2. thought_prompt_responses: Stores user responses linked to prompts
-- ============================================================================

-- ============================================================================
-- TABLE 1: thought_prompts
-- ============================================================================
-- Stores thought prompt questions that are displayed to users
-- Questions are manually inserted by admins/system
CREATE TABLE IF NOT EXISTS thought_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- The thought prompt question text
    question TEXT NOT NULL,
    
    -- Whether this prompt is currently active and should be shown
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fetching active prompts efficiently
CREATE INDEX IF NOT EXISTS idx_thought_prompts_active ON thought_prompts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_thought_prompts_created_at ON thought_prompts(created_at DESC);

-- ============================================================================
-- TABLE 2: thought_prompt_responses
-- ============================================================================
-- Stores user responses to thought prompts
-- Each user can have one response per prompt (enforced by unique constraint)
CREATE TABLE IF NOT EXISTS thought_prompt_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Foreign key to the thought prompt
    thought_prompt_id UUID NOT NULL REFERENCES thought_prompts(id) ON DELETE CASCADE,
    
    -- Foreign key to the user (from auth.users)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- The user's response text
    response TEXT NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Each user can only respond once per prompt
    CONSTRAINT unique_user_prompt_response UNIQUE (thought_prompt_id, user_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_thought_prompt_responses_prompt_id ON thought_prompt_responses(thought_prompt_id);
CREATE INDEX IF NOT EXISTS idx_thought_prompt_responses_user_id ON thought_prompt_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_thought_prompt_responses_created_at ON thought_prompt_responses(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE thought_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE thought_prompt_responses ENABLE ROW LEVEL SECURITY;

-- thought_prompts policies
-- Anyone authenticated can read active prompts
CREATE POLICY "Anyone can read active thought prompts"
    ON thought_prompts
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- thought_prompt_responses policies
-- Users can only read their own responses
CREATE POLICY "Users can read their own responses"
    ON thought_prompt_responses
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can insert their own responses
CREATE POLICY "Users can insert their own responses"
    ON thought_prompt_responses
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own responses
CREATE POLICY "Users can update their own responses"
    ON thought_prompt_responses
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SEED DATA: Initial thought prompts
-- ============================================================================
-- Insert some initial thought prompts for testing
INSERT INTO thought_prompts (question, is_active) VALUES
    ('What''s a recent challenge you faced while building your company, and what did it teach you?', true),
    ('What''s one piece of advice you wish you had received when you started your career?', true),
    ('What''s a common misconception about your industry that you''d like to address?', true),
    ('What''s the most valuable lesson you''ve learned from a failure?', true),
    ('How do you maintain work-life balance while pursuing ambitious goals?', true)
ON CONFLICT DO NOTHING;

