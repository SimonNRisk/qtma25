-- Voice contexts table for storing user voice inputs and AI-generated summaries
CREATE TABLE IF NOT EXISTS voice_contexts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    transcription TEXT NOT NULL,
    summary TEXT,
    key_topics TEXT,
    insights TEXT,
    context TEXT,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying by user and category
CREATE INDEX IF NOT EXISTS idx_voice_contexts_user_id ON voice_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_contexts_category ON voice_contexts(category);
CREATE INDEX IF NOT EXISTS idx_voice_contexts_created_at ON voice_contexts(created_at DESC);

-- RLS (Row Level Security) policies for Supabase
ALTER TABLE voice_contexts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own voice contexts
CREATE POLICY "Users can access own voice contexts" ON voice_contexts
    FOR ALL USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own voice contexts
CREATE POLICY "Users can insert own voice contexts" ON voice_contexts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own voice contexts
CREATE POLICY "Users can update own voice contexts" ON voice_contexts
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own voice contexts
CREATE POLICY "Users can delete own voice contexts" ON voice_contexts
    FOR DELETE USING (auth.uid()::text = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_voice_contexts_updated_at 
    BEFORE UPDATE ON voice_contexts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
