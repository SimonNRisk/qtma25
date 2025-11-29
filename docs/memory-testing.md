# Memory API Testing Guide

Quick steps to verify the new memory + prompt-context endpoints.

## Prerequisites
- Backend running locally (e.g., `uvicorn main:app --reload` from `backend`).
- `.env` configured with `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and auth working.
- A valid JWT access token for a signed-in user (use your normal login flow; copy the bearer token).

Set this for convenience:
```bash
export API_URL="http://localhost:8000"
export TOKEN="YOUR_JWT_HERE"
```

## 1) Add memories (append up to 5 at a time)
```bash
curl -X POST "$API_URL/api/memory" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "memories": [
      {"memory": "Prefers concise LinkedIn posts under 180 words", "source": "first-post", "importance": 4},
      {"memory": "Focuses on AI tooling for sales teams", "source": "generate-posts", "importance": 5}
    ]
  }'
```
Expected: JSON with `"message": "Memories saved"` and inserted rows.

## 2) Get latest memories
```bash
curl -X GET "$API_URL/api/memory?limit=5" \
  -H "Authorization: Bearer $TOKEN"
```
Expected: `"data"` array of recent memories for this user.

## 3) Get prompt-ready context (onboarding + memories + optional news)
```bash
curl -X GET "$API_URL/api/memory/prompt-context?memory_limit=5&news_limit=2" \
  -H "Authorization: Bearer $TOKEN"
```
Response fields:
- `prompt_context`: String you can drop into an LLM prompt (includes onboarding if present, memories, and recent news summaries when available).
- `onboarding`: Raw onboarding record (or null).
- `memories`: Memory rows returned.
- `news`: Recent news hook entries if available.

## Notes
- Max 5 memories per POST; each memory max 500 chars.
- `importance` is 1–5 (default 3) for future weighting/pruning.
- If news data isn’t available, the prompt context still returns onboarding + memories.***
