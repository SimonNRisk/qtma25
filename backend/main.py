from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from linkedin_service import LinkedInService
from linkedin_oauth import LinkedInOAuth

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI()

# Enable CORS so frontend can talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base route (not used at the moment)
@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}

# Example route (for demo of how this works)
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
        
        # TODO: Store token and profile in Supabase
        # For now, just return success
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
    Post text and optional image to LinkedIn
    """
    linkedin_service = LinkedInService()
    return await linkedin_service.post_to_linkedin(text, image)

