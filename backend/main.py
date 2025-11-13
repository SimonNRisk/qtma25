import os
from typing import Annotated, Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from supabase import create_client, Client

from auth import auth_router, get_current_user
from api.openai import router as openai_router
from config import FRONTEND_ORIGIN, get_cors_origins
from openai import OpenAI
from api.linkedin import router as linkedin_router

# Load environment variables
load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")  # optional, but recommended for server writes
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")

# Public client (anon key): good for auth flows and reads with RLS
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Admin client (service role): bypasses RLS for trusted server-side writes
admin: Optional[Client] = None
if SUPABASE_SERVICE_ROLE_KEY:
    admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

app = FastAPI()

# Enable CORS so frontend can talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Schemas ----------
class ProfileBody(BaseModel):
    first_name: str = ""
    last_name: str = ""

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

# Include auth router
app.include_router(auth_router)
app.include_router(openai_router)
app.include_router(linkedin_router)
# ---------- Routes ----------
@app.get("/me")
def get_current_user_profile(current_user: Annotated[dict, Depends(get_current_user)]):
    """Get current user's profile information"""
    return {"user": current_user}
@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}

@app.get("/api/onboarding/data")
async def get_onboarding_data(current_user: Annotated[dict, Depends(get_current_user)]):
    """
    Get user's onboarding data
    """
    try:
        if not admin:
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
