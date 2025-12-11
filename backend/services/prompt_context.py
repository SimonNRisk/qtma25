import os
from typing import Any, Dict, List, Optional

from supabase import Client, create_client

from api.memory import build_memory_prompt_section, build_news_prompt_section
from api.onboarding import build_onboarding_prompt_context
from linkedin_supabase_service import SupabaseService
from services.qdrant_service import QdrantService


class PromptContextService:
    """Builds unified prompt context from onboarding, memories, news, and vector search."""

    def __init__(self):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to build prompt context")

        self.supabase: Client = create_client(supabase_url, supabase_key)

        # Qdrant is optional: if not configured, we degrade gracefully.
        self.qdrant_service: Optional[QdrantService] = None
        try:
            self.qdrant_service = QdrantService()
        except Exception:
            self.qdrant_service = None

    def _get_onboarding(self, user_id: str) -> Optional[dict]:
        result = (
            self.supabase
            .table("onboarding_context")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def _get_memories(self, user_id: str, limit: int) -> List[dict]:
        result = (
            self.supabase
            .table("user_memories")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []

    async def build_prompt_context(
        self,
        user_id: str,
        query: Optional[str],
        memory_limit: int = 5,
        news_limit: int = 3,
        search_top_k: int = 5,
    ) -> Dict[str, Any]:
        onboarding_record = self._get_onboarding(user_id)
        memories = self._get_memories(user_id, memory_limit)

        news_items: List[dict] = []
        if news_limit > 0:
            try:
                news_service = SupabaseService()
                news_items = await news_service.get_news_hooks(
                    industry_slug=None,
                    created_after=None,
                )
                news_items = news_items[:news_limit]
            except Exception as err:
                print(f"Warning: failed to load news hooks for prompt context: {err}")

        vector_matches: List[Dict[str, Any]] = []
        if query and self.qdrant_service:
            try:
                vector_matches = self.qdrant_service.search(
                    query=query,
                    user_id=user_id,
                    top_k=search_top_k,
                )
            except Exception as err:
                print(f"Warning: vector search skipped: {err}")

        sections: List[str] = []

        if onboarding_record:
            sections.append(build_onboarding_prompt_context(onboarding_record))
        else:
            sections.append("Onboarding context: none found for this user.")

        sections.append(build_memory_prompt_section(memories))

        if news_limit > 0:
            sections.append(build_news_prompt_section(news_items))

        if vector_matches:
            formatted_hits = []
            for hit in vector_matches:
                payload = hit.get("payload") or {}
                content = payload.get("content") or ""
                snippet = content[:500] + ("..." if len(content) > 500 else "")
                formatted_hits.append(f"- score {hit.get('score'):.4f}: {snippet}")
            sections.append("Vector search matches:\n" + "\n".join(formatted_hits))

        prompt_context = "\n\n".join(sections).strip() if sections else ""

        return {
            "prompt_context": prompt_context or "No personalization context available.",
            "onboarding": onboarding_record,
            "memories": memories,
            "news": news_items,
            "vector_matches": vector_matches,
        }
