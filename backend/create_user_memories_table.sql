-- Create user_memories table to store compact, prompt-ready user memory bullets
CREATE TABLE IF NOT EXISTS user_memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    memory TEXT NOT NULL,
    source TEXT DEFAULT 'unspecified',
    importance INTEGER DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_created_at ON user_memories(created_at DESC);

-- RLS setup
ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;

-- Users can only see their own memories
CREATE POLICY "Users can view their own memories" ON user_memories
FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own memories
CREATE POLICY "Users can insert their own memories" ON user_memories
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own memories (if needed)
CREATE POLICY "Users can update their own memories" ON user_memories
FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION update_user_memories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_memories_updated_at
    BEFORE UPDATE ON user_memories
    FOR EACH ROW
    EXECUTE FUNCTION update_user_memories_updated_at();
