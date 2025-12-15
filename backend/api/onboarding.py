from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated, Optional
from auth import get_current_user
from supabase import create_client, Client
import os
from pydantic import BaseModel
from textwrap import dedent

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")  # optional, but recommended for server writes

# Public client (anon key): good for auth flows and reads with RLS
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


class OnboardingData(BaseModel):
    name: str
    company: str
    role: str
    email: str = ""  # Optional since we get it from user account
    industry: str
    company_mission: str
    target_audience: str
    topics_to_post: str
    selected_goals: list[str]
    selected_hooks: list[str]


# Admin client (service role): bypasses RLS for trusted server-side writes
admin: Optional[Client] = None
if SUPABASE_SERVICE_ROLE_KEY:
    admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def build_onboarding_prompt_context(onboarding_record: dict) -> str:
    """
    Build a human-readable onboarding summary string that can be dropped into an LLM prompt.
    """
    def format_value(value):
        if isinstance(value, list):
            return ", ".join([v for v in value if v]) if value else "Not provided"
        return value if value else "Not provided"

    name = onboarding_record.get("name") or "Unknown user"
    company = onboarding_record.get("company") or "Unknown company"
    role = onboarding_record.get("role") or "Unknown role"
    email = onboarding_record.get("email") or "No email provided"
    industry = onboarding_record.get("industry") or "No industry provided"
    mission = onboarding_record.get("company_mission") or "No mission provided"
    audience = onboarding_record.get("target_audience") or "No audience provided"
    topics = onboarding_record.get("topics_to_post") or "No topics provided"
    goals = format_value(onboarding_record.get("selected_goals"))
    hooks = format_value(onboarding_record.get("selected_hooks"))

    prompt_context = dedent(
        f"""
        Onboarding context: Personalization data captured during signup. Use it to shape tone, examples, and relevance.
        Who they are: {name} — {role} at {company} ({industry}). Contact: {email}.
        Company mission: {mission}
        Target audience: {audience}
        Topics to post about: {topics}
        Goals they care about: {goals}
        Hooks/formats they like: {hooks}
        """
    ).strip()

    return prompt_context


@router.get("/data")
async def get_onboarding_data(current_user: Annotated[dict, Depends(get_current_user)]):
    """
    Get user's onboarding data
    """
    try:
        if admin is None:
            raise HTTPException(status_code=500, detail="Admin client not available")

        result = admin.table("onboarding_context").select("*").eq("user_id", current_user["id"]).execute()

        if not result.data:
            return {"message": "No onboarding data found", "data": None}

        return {
            "message": "Onboarding data retrieved successfully",
            "data": result.data[0]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving onboarding data: {str(e)}")


@router.post("/data")
async def submit_onboarding_data(current_user: Annotated[dict, Depends(get_current_user)], onboarding_data: OnboardingData):
    """
    Post user's onboarding data (upserts if user already has data)
    """
    try:
        if admin is None:
            raise HTTPException(status_code=500, detail="Admin client not available")

        # Use upsert to handle both insert and update (since user_id is UNIQUE)
        result = admin.table("onboarding_context").upsert({
            "user_id": current_user["id"],
            "name": onboarding_data.name,
            "company": onboarding_data.company,
            "role": onboarding_data.role,
            "email": onboarding_data.email,
            "industry": onboarding_data.industry,
            "company_mission": onboarding_data.company_mission,
            "target_audience": onboarding_data.target_audience,
            "topics_to_post": onboarding_data.topics_to_post,
            "selected_goals": onboarding_data.selected_goals,
            "selected_hooks": onboarding_data.selected_hooks
        }, on_conflict="user_id").execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting onboarding data: {str(e)}")

    return {
        "message": "Onboarding data submitted successfully",
        "data": result.data[0]
    }


@router.get("/prompt-context")
async def get_onboarding_prompt_context(current_user: Annotated[dict, Depends(get_current_user)]):
    """
    Build a prompt-ready onboarding context string for the current user.
    """
    try:
        if admin is None:
            raise HTTPException(status_code=500, detail="Admin client not available")

        result = (
            admin
            .table("onboarding_context")
            .select("*")
            .eq("user_id", current_user["id"])
            .execute()
        )

        if not result.data:
            return {
                "message": "No onboarding data found",
                "prompt_context": None,
                "data": None
            }

        onboarding_record = result.data[0]
        prompt_context = build_onboarding_prompt_context(onboarding_record)

        return {
            "message": "Onboarding prompt context built successfully",
            "prompt_context": prompt_context,
            "data": onboarding_record
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building onboarding prompt context: {str(e)}")
