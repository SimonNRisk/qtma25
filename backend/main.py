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
from voice_service import VoiceService, VoiceContextRequest, VoiceContextResponse

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

# ---------- User Profile Endpoint ----------

@app.get("/me")
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Get current user's profile information
    """
    try:
        return {
            "id": current_user["id"],
            "email": current_user.get("email", ""),
            "first_name": current_user.get("first_name", ""),
            "last_name": current_user.get("last_name", ""),
            "created_at": current_user.get("created_at", "")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user profile: {str(e)}")

