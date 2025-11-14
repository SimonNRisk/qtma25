from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated
from auth import get_current_user
from supabase import create_client, Client
import os
from pydantic import BaseModel

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
admin: Client | None = None
if SUPABASE_SERVICE_ROLE_KEY:
    admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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