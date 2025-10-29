import os
from typing import Annotated, Optional

from fastapi import FastAPI, Depends, HTTPException, status, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

from linkedin_service import LinkedInService
from linkedin_oauth import LinkedInOAuth
from linkedin_supabase_service import SupabaseService
from auth import auth_router, get_current_user
from voice_service import VoiceService, VoiceContextRequest, VoiceContextResponse

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

# Initialize LinkedIn Supabase service
linkedin_supabase_service = SupabaseService()

# Initialize Voice service (use admin client to bypass RLS)
voice_service = VoiceService(admin if admin else supabase)

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
    email: str = ""  # Optional since we get it from user account
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
def linkedin_auth(current_user: Annotated[dict, Depends(get_current_user)]):
    """
    Generate LinkedIn OAuth URL for user to authenticate
    """
    oauth = LinkedInOAuth()
    # Include user ID in the state parameter
    auth_data = oauth.get_auth_url()
    # Encode user ID in state parameter
    import base64
    import json
    user_id = current_user["id"]
    state_data = {
        "state": auth_data["state"],
        "user_id": user_id
    }
    encoded_state = base64.b64encode(json.dumps(state_data).encode()).decode()
    
    return {
        "auth_url": auth_data["auth_url"].replace(auth_data["state"], encoded_state),
        "state": encoded_state
    }

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
        
        # Extract user ID from state parameter
        user_id = None
        if state:
            try:
                import base64
                import json
                decoded_state = base64.b64decode(state.encode()).decode()
                state_data = json.loads(decoded_state)
                user_id = state_data.get("user_id")
            except Exception as e:
                print(f"Error decoding state parameter: {e}")
        
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid state parameter - user ID not found")
        
        # Exchange code for token
        token_data = await oauth.exchange_code_for_token(code)
        access_token = token_data.get("access_token")
        
        # Get user profile
        profile_data = await oauth.get_user_profile(access_token)
        
        # Store token in Supabase using the authenticated user's ID
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

# ---------- Voice Context Endpoints ----------

@app.post("/api/voice/upload")
async def upload_voice_context(
    audio: UploadFile = File(...),
    category: str = Form("general"),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload audio file, transcribe it, and store context
    """
    if not audio.content_type or not audio.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    try:
        # Save uploaded file temporarily
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await audio.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Transcribe audio
            transcription = await voice_service.transcribe_audio(temp_file_path)
            
            if not transcription.strip():
                raise HTTPException(status_code=400, detail="No speech detected in audio file")
            
            # Store context with AI analysis
            result = await voice_service.store_voice_context(
                user_id=current_user["id"],
                transcription=transcription,
                category=category
            )
            
            return result
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice processing failed: {str(e)}")

@app.get("/api/voice/contexts")
async def get_voice_contexts(
    category: Optional[str] = None,
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's voice contexts, optionally filtered by category
    """
    try:
        contexts = await voice_service.get_user_voice_contexts(
            user_id=current_user["id"],
            category=category,
            limit=limit
        )
        return {"contexts": contexts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve contexts: {str(e)}")

@app.get("/api/voice/context-summary")
async def get_context_summary(
    categories: Optional[str] = None,  # comma-separated categories
    current_user: dict = Depends(get_current_user)
):
    """
    Get consolidated context summary for content generation
    """
    try:
        category_list = None
        if categories:
            category_list = [cat.strip() for cat in categories.split(',')]
        
        context_summary = await voice_service.get_context_for_generation(
            user_id=current_user["id"],
            categories=category_list
        )
        
        return {"context_summary": context_summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get context summary: {str(e)}")

@app.delete("/api/voice/contexts/{context_id}")
async def delete_voice_context(
    context_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a specific voice context
    """
    try:
        result = voice_service.supabase.table('voice_contexts').delete().eq('id', context_id).eq('user_id', current_user["id"]).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Voice context not found")
        
        return {"message": "Voice context deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete context: {str(e)}")

# ---------- Onboarding Endpoints ----------

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
            "email": current_user["email"],  # Use email from user account
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

@app.get("/api/linkedin/status")
async def get_linkedin_status(current_user: Annotated[dict, Depends(get_current_user)]):
    """
    Check if user has a valid LinkedIn token
    """
    try:
        user_id = current_user["id"]
        token_data = await linkedin_supabase_service.get_linkedin_token(user_id)
        
        if token_data:
            return {
                "connected": True,
                "profile_data": token_data.get("profile_data", {}),
                "connected_at": token_data.get("created_at"),
                "expires_at": token_data.get("expires_at")
            }
        else:
            return {
                "connected": False,
                "profile_data": None,
                "connected_at": None,
                "expires_at": None
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking LinkedIn status: {str(e)}")

