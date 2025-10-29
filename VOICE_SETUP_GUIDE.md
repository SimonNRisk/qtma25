# Voice Context System Setup Guide

## Voice-to-Context Feature Overview

This system allows users to record voice messages that are automatically transcribed, analyzed, and used to enrich AI content generation. The system uses OpenAI's Whisper for speech-to-text and GPT for context analysis.

## Architecture

```
User Voice → Frontend Recorder → Backend API → Whisper → OpenAI Analysis → Supabase Storage → Context-Rich Generation
```

## 📋 Manual Setup Required

### 1. Environment Variables

**Add to your backend `.env` file:**

```bash
# OpenAI API Key (required for Whisper and content analysis)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase (should already be configured)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Backend Dependencies

**Already installed automatically, but if needed:**

```bash
cd backend
source venv/bin/activate
pip install whisper openai pydub python-multipart
```

### 3. Frontend Permissions

**The frontend will automatically request microphone permissions when users try to record.**

No additional setup needed - the browser will handle permission requests.

## How It Works

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

## User Experience

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

