# Onboarding Context Table Setup

This document describes the setup for storing user onboarding data in Supabase.

## Database Table

The `onboarding_context` table stores all the answers from the onboarding flow:

### Table Structure

```sql
CREATE TABLE onboarding_context (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Personal Information
    name TEXT,
    company TEXT,
    role TEXT,
    email TEXT,
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
```

### Setup Instructions

1. **Run the SQL script in Supabase:**

   ```bash
   # Copy the contents of backend/create_onboarding_table.sql
   # and run it in your Supabase SQL editor
   ```

2. **The table includes:**
   - Row Level Security (RLS) policies
   - Automatic timestamp updates
   - Unique constraint per user
   - Proper indexes for performance

## Frontend Integration

### Data Flow

1. **Form Collection:** The onboarding form collects all user data
2. **Auto-Save:** `useOnboarding` hook automatically saves to localStorage on step changes
3. **Submission:** Data is sent to backend endpoint `/api/onboarding/submit`
4. **Storage:** Backend saves data to `onboarding_context` table
5. **Retrieval:** Use `getOnboardingData()` utility to fetch user's data (tries Supabase first, then localStorage)
6. **Persistence:** Form data is restored from localStorage on page reload

### Available Fields

- **Personal Info:** name, company, role, email, industry
- **Company Details:** company_mission, target_audience, topics_to_post
- **Preferences:** selected_goals (array), selected_hooks (array)

### Usage Examples

```typescript
import { getOnboardingData, updateOnboardingData, syncLocalStorageToSupabase } from '@/lib/onboarding'

// Get user's onboarding data (tries Supabase first, then localStorage)
const onboardingData = await getOnboardingData()

// Update specific fields
await updateOnboardingData({
  company_mission: 'Updated mission statement'
})

// Sync localStorage data to Supabase (useful for migration)
await syncLocalStorageToSupabase()
```

## Backend Endpoints

- `POST /api/onboarding/submit` - Save onboarding data
- `GET /api/onboarding/data` - Retrieve user's onboarding data

Both endpoints require authentication and use the current user's ID.
