import os
from typing import Annotated, Optional

from fastapi import FastAPI, File, UploadFile, Form, Depends, HTTPException, status, Header

from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from linkedin_service import LinkedInService
from linkedin_oauth import LinkedInOAuth
from linkedin_supabase_service import SupabaseService

# Load environment variables
load_dotenv()
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
from dotenv import load_dotenv
from auth import auth_router, get_current_user

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

# Initialize LinkedIn Supabase service
linkedin_supabase_service = SupabaseService()

# Enable CORS so frontend can talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
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
    email: str
    industry: str
    company_mission: str
    target_audience: str
    topics_to_post: str
    selected_goals: list[str]
    selected_hooks: list[str]

# Include auth router
app.include_router(auth_router)

# ---------- Routes ----------
@app.get("/me")
def get_current_user_profile(current_user: Annotated[dict, Depends(get_current_user)]):
    """Get current user's profile information"""
    return {"user": current_user}
@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}

@app.get("/api/hello")
def say_hello():
    return {"message": "Hello from /api/hello"}

# Pydantic model for request body
class PostRequest(BaseModel):
    text: str

# LinkedIn OAuth endpoints
@app.get("/api/linkedin/auth")
def linkedin_auth():
    """
    Generate LinkedIn OAuth URL for user to authenticate
    """
    oauth = LinkedInOAuth()
    return oauth.get_auth_url()

@app.post("/api/linkedin/callback")
async def linkedin_callback(request: dict):
    """
    Handle LinkedIn OAuth callback and exchange code for access token
    """
    try:
        oauth = LinkedInOAuth()
        code = request.get("code")
        state = request.get("state")
        
        if not code:
            raise HTTPException(status_code=400, detail="No authorization code provided")
        
        # Exchange code for token
        token_data = await oauth.exchange_code_for_token(code)
        access_token = token_data.get("access_token")
        
        # Get user profile
        profile_data = await oauth.get_user_profile(access_token)
        
        # Store token in Supabase
        user_id = profile_data.get("sub", "demo_user")
        await linkedin_supabase_service.store_linkedin_token(user_id, access_token, profile_data)
        
        return {
            "message": "Authentication successful",
            "access_token": access_token,
            "profile": profile_data 
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth error: {str(e)}")

# LinkedIn post endpoint with image support
@app.post("/api/linkedin/post")
async def post_to_linkedin(
    text: str = Form(...),
    image: UploadFile = File(None)
):
    """
    Post text and optional image to LinkedIn using OAuth token
    """
    # For demo purposes, get the first available token
    # In production, you'd get the user_id from the session/auth
    try:
        # Get all tokens (in production, filter by authenticated user)
        result = linkedin_supabase_service.supabase.table('linkedin_tokens').select('*').execute()
        
        if not result.data:
            return {"error": "No authenticated users found. Please connect your LinkedIn account first."}
        
        # Get the first user's token (in production, get from session)
        token_data = result.data[0]
        access_token = token_data["access_token"]
    except Exception as e:
        return {"error": f"Error retrieving token: {str(e)}"}
    
    # Create LinkedIn service with OAuth token
    linkedin_service = LinkedInService(access_token=access_token)
    return await linkedin_service.post_to_linkedin(text, image)

# Onboarding data submission endpoint
@app.post("/api/onboarding/submit")
async def submit_onboarding_data(
    onboarding_data: OnboardingData,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """
    Save user onboarding data to Supabase
    """
    try:
        if not admin:
            raise HTTPException(status_code=500, detail="Admin client not available")
        
        # Save onboarding data to Supabase
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
            "selected_hooks": onboarding_data.selected_hooks,
        }).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save onboarding data")
        
        return {
            "message": "Onboarding data saved successfully",
            "data": result.data[0]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving onboarding data: {str(e)}")

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

