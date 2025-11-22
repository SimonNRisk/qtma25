-- Create news_hooks table to store industry news summaries and generated hooks
CREATE TABLE IF NOT EXISTS news_hooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Industry information
    industry TEXT NOT NULL,
    industry_slug TEXT NOT NULL,
    
    -- News summary and generated hooks
    summary TEXT NOT NULL,
    hooks JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for querying by industry
    CONSTRAINT valid_hooks_array CHECK (jsonb_typeof(hooks) = 'array')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_news_hooks_industry_slug ON news_hooks(industry_slug);
CREATE INDEX IF NOT EXISTS idx_news_hooks_created_at ON news_hooks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_hooks_industry ON news_hooks(industry);

