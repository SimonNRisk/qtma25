import os
import re
from typing import Annotated, Optional, List

from fastapi import FastAPI, File, UploadFile, Form, Depends, HTTPException, status, Header

from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from linkedin_service import LinkedInService
from linkedin_oauth import LinkedInOAuth
from linkedin_supabase_service import SupabaseService
from openai import OpenAI

# Load environment variables
load_dotenv()

from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
from auth import auth_router, get_current_user

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")  # optional, but recommended for server writes
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")
OPENAI_API_KEY = os.environ.get("OPENAI_KEY")

# Initialize OpenAI client
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

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

# Pydantic model for LinkedIn post generation request
class LinkedInPostGenerationRequest(BaseModel):
    quantity: int = 10
    context: Optional[str] = None
    length: int = 2  # 1=short, 2=medium, 3=long
    tone: Optional[str] = None  # Optional: professional, casual, friendly, etc.
    audience: Optional[str] = None  # Optional: more specific audience targeting

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

# LinkedIn post generation endpoint
@app.post("/api/linkedin/generate-posts")
async def generate_linkedin_posts(request: LinkedInPostGenerationRequest):
    """
    Generate multiple LinkedIn post hooks/content using OpenAI
    
    Parameters:
    - quantity: Number of posts to generate (default: 10, minimum: 3)
    - context: Optional user context to personalize posts (default: null for generic posts)
    - length: Post length - 1=short (~150 words), 2=medium (~300 words), 3=long (~500 words) (default: 2)
    - tone: Optional tone (professional, casual, friendly, etc.)
    - audience: Optional specific audience targeting
    
    Returns a list of unique LinkedIn post suggestions in different styles.
    """
    # Validate OpenAI API key
    if not openai_client:
        raise HTTPException(
            status_code=500, 
            detail="OpenAI API key not configured. Please set OPENAI_KEY in your .env file"
        )
    
    # Validate quantity
    if request.quantity < 3:
        raise HTTPException(
            status_code=400, 
            detail="Quantity must be at least 3"
        )
    
    # Validate length
    if request.length not in [1, 2, 3]:
        raise HTTPException(
            status_code=400, 
            detail="Length must be 1 (short), 2 (medium), or 3 (long)"
        )
    
    # Determine word count based on length
    word_counts = {1: "about 150", 2: "about 300", 3: "about 500"}
    target_words = word_counts[request.length]
    
    # Build the prompt
    context_part = ""
    if request.context:
        context_part = f"\n\nUser Context: {request.context}\nMake the posts specific and relevant to this context."
    else:
        context_part = "\n\nUser Context: Not provided. Create generic but engaging startup-focused posts that would work for any founder/entrepreneur."
    
    tone_part = ""
    if request.tone:
        tone_part = f"\nTone: {request.tone}"
    
    audience_part = ""
    if request.audience:
        audience_part = f"\nTarget Audience: {request.audience}"
    
    system_prompt = f"""You are an expert LinkedIn content creator specializing in helping startups and entrepreneurs gain traction.

Your task is to generate {request.quantity} unique LinkedIn posts, each with a DIFFERENT style and approach. Each post should be approximately {target_words} words.{context_part}{tone_part}{audience_part}

Requirements:
1. Each post must be UNIQUE in style - use different formats like: storytelling, tips/advice, thought leadership, engagement questions, case studies, personal anecdotes, etc.
2. Posts should be engaging and designed to get traction for startup founders/entrepreneurs
3. Include relevant hashtags at the end of each post (3-5 hashtags)
4. Make posts actionable and valuable
5. Each post should stand alone and not reference the others
6. Posts should encourage engagement (comments, shares, reactions)

Output ONLY the posts, numbered 1-{request.quantity}, with no additional commentary.
"""
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate {request.quantity} unique LinkedIn posts with different styles."}
            ],
            temperature=0.9,  # Higher temperature for more creative and varied outputs
            max_tokens=4000 if request.length == 3 else 2500 if request.length == 2 else 1500
        )
        
        posts_text = response.choices[0].message.content
        
        # Parse the posts (split by numbers)
        posts_list = re.split(r'\n(?=\d+[\.\:\)])', posts_text)
        
        # Clean up each post
        cleaned_posts = []
        for post in posts_list:
            if post.strip():
                # Remove leading numbers and formatting
                post = re.sub(r'^\d+[\.\:\)]\s*', '', post)
                post = post.strip()
                if post:
                    cleaned_posts.append(post)
        
        return {
            "success": True,
            "quantity": len(cleaned_posts),
            "posts": cleaned_posts,
            "parameters": {
                "quantity": request.quantity,
                "context": request.context,
                "length": request.length,
                "tone": request.tone,
                "audience": request.audience
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating posts: {str(e)}"
        )

