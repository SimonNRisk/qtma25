-- RAN OCT 28 (UPDATED) --
-- Create onboarding_context table to store user onboarding responses
-- Email is populated from user account during onboarding sync
CREATE TABLE IF NOT EXISTS onboarding_context (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Personal Information
    name TEXT,
    company TEXT,
    role TEXT,
    email TEXT,  -- Populated from auth.users during sync
    industry TEXT,
    
    -- Company Details
    company_mission TEXT,
    target_audience TEXT,
    topics_to_post TEXT,
    
    -- User Preferences (stored as JSONB arrays)
    selected_goals JSONB DEFAULT '[]'::jsonb,
    selected_hooks JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one onboarding context per user
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_onboarding_context_user_id ON onboarding_context(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_context_created_at ON onboarding_context(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE onboarding_context ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own onboarding context
CREATE POLICY "Users can view their own onboarding context" ON onboarding_context
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding context" ON onboarding_context
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding context" ON onboarding_context
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_onboarding_context_updated_at 
    BEFORE UPDATE ON onboarding_context 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
