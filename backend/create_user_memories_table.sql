-- Create user_memories table to store durable user memories/summaries
CREATE TABLE IF NOT EXISTS user_memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    memory TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'unspecified',
    importance INT CHECK (importance BETWEEN 1 AND 5) DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_created_at ON user_memories(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can manage only their own memories
CREATE POLICY "Users can view their own memories" ON user_memories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memories" ON user_memories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories" ON user_memories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories" ON user_memories
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger to keep updated_at fresh
CREATE TRIGGER update_user_memories_updated_at
    BEFORE UPDATE ON user_memories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
