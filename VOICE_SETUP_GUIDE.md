# Voice Context System Setup Guide

## 🎤 Voice-to-Context Feature Overview

This system allows users to record voice messages that are automatically transcribed, analyzed, and used to enrich AI content generation. The system uses OpenAI's Whisper for speech-to-text and GPT for context analysis.

## 🏗️ Architecture

```
User Voice → Frontend Recorder → Backend API → Whisper → OpenAI Analysis → Supabase Storage → Context-Rich Generation
```

## 📋 Manual Setup Required

### 1. Database Setup (Supabase)

**Run this SQL in your Supabase SQL Editor:**

```sql
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

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_voice_contexts_user_id ON voice_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_contexts_category ON voice_contexts(category);
CREATE INDEX IF NOT EXISTS idx_voice_contexts_created_at ON voice_contexts(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE voice_contexts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access own voice contexts" ON voice_contexts
    FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own voice contexts" ON voice_contexts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own voice contexts" ON voice_contexts
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own voice contexts" ON voice_contexts
    FOR DELETE USING (auth.uid()::text = user_id);

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-updating timestamps
CREATE TRIGGER update_voice_contexts_updated_at 
    BEFORE UPDATE ON voice_contexts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. Environment Variables

**Add to your backend `.env` file:**

```bash
# OpenAI API Key (required for Whisper and content analysis)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase (should already be configured)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Backend Dependencies

**Already installed automatically, but if needed:**

```bash
cd backend
source venv/bin/activate
pip install whisper openai pydub python-multipart
```

### 4. Frontend Permissions

**The frontend will automatically request microphone permissions when users try to record.**

No additional setup needed - the browser will handle permission requests.

## 🚀 Features Implemented

### Backend Features ✅
- **Voice Upload Endpoint** (`POST /api/voice/upload`)
  - Accepts audio files (wav, mp3, etc.)
  - Transcribes using Whisper
  - Analyzes with OpenAI GPT
  - Stores in Supabase with RLS

- **Context Retrieval** (`GET /api/voice/contexts`)
  - Fetch user's voice contexts
  - Filter by category
  - Paginated results

- **Context Summary** (`GET /api/voice/context-summary`)
  - Consolidated context for content generation
  - Category filtering
  - Optimized for AI prompts

- **Context Management** (`DELETE /api/voice/contexts/{id}`)
  - Delete specific voice contexts
  - User-scoped (RLS protected)

### Frontend Features ✅
- **Voice Recorder Component** (`/src/components/VoiceRecorder.tsx`)
  - Real-time audio level monitoring
  - Recording timer
  - Audio format handling
  - Error handling and user feedback

- **Voice Context Page** (`/voice-context`)
  - Record new voice contexts
  - Category selection
  - View and manage existing contexts
  - Delete contexts

- **Enhanced Generate Page** (`/generate`)
  - Voice context integration toggle
  - Context preview panel
  - Enhanced prompts with user context
  - Improved UI with context awareness

## 🎯 How It Works

### 1. Recording Process
1. User clicks record button
2. Browser requests microphone permission
3. Audio is recorded in real-time with visual feedback
4. Recording is stopped and uploaded to backend

### 2. Processing Pipeline
1. **Upload**: Audio file sent to `/api/voice/upload`
2. **Transcription**: Whisper converts speech to text
3. **Analysis**: OpenAI GPT analyzes transcription for:
   - Summary (2-3 sentences)
   - Key topics/themes
   - Actionable insights
   - Relevant context for generation
4. **Storage**: All data stored in Supabase with user association

### 3. Content Generation Enhancement
1. User enables "Use Voice Context" toggle
2. System fetches user's voice context summary
3. Original prompt is enhanced with context:
   ```
   Context about the user: [voice context summary]
   
   User request: [original prompt]
   
   Please generate content that takes into account the user's context and preferences mentioned above.
   ```

## 📱 User Experience

### Voice Context Categories
- **General**: General preferences and thoughts
- **LinkedIn**: Professional context and LinkedIn-specific preferences
- **Company**: Company-specific information and context
- **Personal**: Personal background and experiences
- **Preferences**: Writing style and content preferences
- **Expertise**: Professional expertise and knowledge areas

### Recording Features
- **Visual Feedback**: Real-time audio level indicator
- **Timer**: Shows recording duration
- **Error Handling**: Clear error messages for permissions/technical issues
- **Processing Indicator**: Shows when transcription is in progress

### Context Management
- **View Contexts**: See all recorded contexts with summaries
- **Category Filtering**: Organize contexts by category
- **Full Transcriptions**: Expandable view of complete transcriptions
- **Delete**: Remove unwanted contexts
- **Timestamps**: See when contexts were recorded

## 🔧 Technical Implementation

### Security
- **RLS (Row Level Security)**: Users can only access their own contexts
- **Authentication**: All endpoints require valid user authentication
- **File Validation**: Audio file type validation on upload
- **Temporary Files**: Audio files are cleaned up after processing

### Performance
- **Lazy Loading**: Whisper model loaded only when needed
- **Efficient Storage**: Optimized database schema with proper indexing
- **Context Caching**: Voice context summary cached on frontend
- **File Cleanup**: Temporary audio files automatically deleted

### Error Handling
- **Graceful Degradation**: System works without voice context if unavailable
- **User Feedback**: Clear error messages for all failure scenarios
- **Fallback Processing**: If OpenAI analysis fails, uses basic transcription
- **Permission Handling**: Proper microphone permission request flow

## 🎉 Ready to Use!

The voice context system is now fully implemented and ready to use. Users can:

1. **Record Context**: Visit `/voice-context` to record voice messages
2. **Generate Content**: Use `/generate` with voice context integration
3. **Manage Contexts**: View, organize, and delete voice contexts
4. **Enhanced Generation**: Get personalized content based on voice context

The system will automatically enhance content generation with user-provided context, making AI outputs more relevant and personalized.

## 🔍 Testing the System

1. **Visit** `http://localhost:3000/voice-context`
2. **Record** a voice message about your preferences
3. **Go to** `http://localhost:3000/generate`
4. **Enable** "Use Voice Context" toggle
5. **Generate** content and see how it's enhanced with your context!

## 🛠️ Troubleshooting

### Common Issues
- **Microphone Permission**: Ensure browser has microphone access
- **OpenAI API**: Verify OPENAI_API_KEY is set correctly
- **Database**: Run the SQL schema in Supabase
- **Dependencies**: Ensure all Python packages are installed

### Debug Endpoints
- `GET /api/voice/contexts` - Check if contexts are being stored
- `GET /api/voice/context-summary` - Verify context retrieval
- Check browser console for frontend errors
- Check backend logs for processing errors
