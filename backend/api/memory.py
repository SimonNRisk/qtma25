import os
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, conint, constr
from supabase import Client, create_client

from auth import get_current_user
from api.onboarding import build_onboarding_prompt_context
from linkedin_supabase_service import SupabaseService

router = APIRouter(prefix="/api/memory", tags=["memory"])

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Public client (anon key) for read operations when RLS is on
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Admin client (service role) for trusted server-side writes
admin: Optional[Client] = None
if SUPABASE_SERVICE_ROLE_KEY:
    admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


class MemoryItem(BaseModel):
    memory: constr(strip_whitespace=True, min_length=1, max_length=500)
    source: constr(strip_whitespace=True, min_length=1, max_length=100) = "unspecified"
    importance: Optional[conint(ge=1, le=5)] = 3


class MemoryBatchRequest(BaseModel):
    memories: List[MemoryItem]


def build_memory_prompt_section(memories: List[dict]) -> str:
    """Render memories as concise bullet points for LLM prompts."""
    if not memories:
        return "No stored memories yet."

    lines = []
    for item in memories:
        memory = item.get("memory", "").strip()
        source = item.get("source") or "unspecified"
        importance = item.get("importance")
        suffix = f" (source: {source}" + (f", importance: {importance}" if importance else "") + ")"
        if memory:
            lines.append(f"- {memory}{suffix}")

    return "User memory (keep this in mind):\n" + "\n".join(lines)


def build_news_prompt_section(news_items: List[dict]) -> str:
    """Format recent news context for prompts."""
    if not news_items:
        return "No recent news context available."

    lines = []
    for item in news_items:
        industry = item.get("industry") or item.get("industry_slug") or "News"
        summary = item.get("summary") or ""
        lines.append(f"- {industry}: {summary}")
    return "Recent news context:\n" + "\n".join(lines)


@router.get("")
async def get_memories(
    current_user: Annotated[dict, Depends(get_current_user)],
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
):
    """Return the latest memories for the current user."""
    try:
        result = (
            supabase
            .table("user_memories")
            .select("*")
            .eq("user_id", current_user["id"])
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return {
            "message": "Memories retrieved",
            "data": result.data or []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving memories: {str(e)}")


@router.post("")
async def add_memories(
    current_user: Annotated[dict, Depends(get_current_user)],
    payload: MemoryBatchRequest
):
    """Append new memory bullets for the current user."""
    if admin is None:
        raise HTTPException(status_code=500, detail="Admin client not available")

    if len(payload.memories) == 0:
        raise HTTPException(status_code=400, detail="No memories provided")
    if len(payload.memories) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 memories per request")

    try:
        rows = []
        for mem in payload.memories:
            rows.append({
                "user_id": current_user["id"],
                "memory": mem.memory.strip(),
                "source": mem.source.strip(),
                "importance": mem.importance or 3
            })

        result = admin.table("user_memories").insert(rows).execute()
        return {
            "message": "Memories saved",
            "inserted": len(result.data) if result.data else 0,
            "data": result.data or []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving memories: {str(e)}")


@router.get("/prompt-context")
async def get_prompt_context(
    current_user: Annotated[dict, Depends(get_current_user)],
    memory_limit: Annotated[int, Query(ge=1, le=20)] = 5,
    news_limit: Annotated[int, Query(ge=0, le=10)] = 3,
    industry_slug: Annotated[Optional[str], Query()] = None,
):
    """
    Build a prompt-ready context string that stitches onboarding data, stored memories, and recent news summaries.
    """
    if admin is None:
        raise HTTPException(status_code=500, detail="Admin client not available")

    try:
        onboarding_result = (
            admin
            .table("onboarding_context")
            .select("*")
            .eq("user_id", current_user["id"])
            .execute()
        )
        onboarding_record = onboarding_result.data[0] if onboarding_result.data else None

        memories_result = (
            admin
            .table("user_memories")
            .select("*")
            .eq("user_id", current_user["id"])
            .order("created_at", desc=True)
            .limit(memory_limit)
            .execute()
        )
        memories = memories_result.data or []

        news_items: List[dict] = []
        if news_limit > 0:
            try:
                news_service = SupabaseService()
                news_items = await news_service.get_news_hooks(
                    industry_slug=industry_slug,
                    created_after=None
                )
                news_items = news_items[:news_limit]
            except Exception as news_err:
                print(f"Warning: failed to load news context: {news_err}")
                news_items = []

        sections = []
        if onboarding_record:
            sections.append(build_onboarding_prompt_context(onboarding_record))
        else:
            sections.append("Onboarding context: none found for this user.")

        sections.append(build_memory_prompt_section(memories))
        if news_limit > 0:
            sections.append(build_news_prompt_section(news_items))

        prompt_context = "\n\n".join(sections).strip()

        return {
            "message": "Prompt context built successfully",
            "prompt_context": prompt_context,
            "onboarding": onboarding_record,
            "memories": memories,
            "news": news_items
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building prompt context: {str(e)}")
