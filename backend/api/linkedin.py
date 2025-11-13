from fastapi import APIRouter, HTTPException, Depends, Form, File, UploadFile
from pydantic import BaseModel
import os
import re
import base64
import json
from dotenv import load_dotenv
from typing import Optional, Annotated, List, Dict, Any
from openai import OpenAI
from linkedin_supabase_service import SupabaseService
from linkedin_oauth import LinkedInOAuth
from linkedin_service import LinkedInService
from auth import get_current_user

load_dotenv()

router = APIRouter(prefix="/api/linkedin", tags=["linkedin"])

# Initialize OpenAI client
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Initialize LinkedIn Supabase service
linkedin_supabase_service = SupabaseService()

# Pydantic models
class LinkedInCallbackRequest(BaseModel):
    code: str
    state: Optional[str] = None

class LinkedInPostGenerationRequest(BaseModel):
    quantity: int = 10
    context: Optional[str] = None
    length: int = 2  # 1=short, 2=medium, 3=long
    tone: Optional[str] = None  # Optional: professional, casual, friendly, etc.
    audience: Optional[str] = None  # Optional: more specific audience targeting

# LinkedIn OAuth endpoints
@router.get("/auth")
def linkedin_auth(current_user: Annotated[dict, Depends(get_current_user)]):
    """
    Generate LinkedIn OAuth URL for user to authenticate
    """
    oauth = LinkedInOAuth()
    # Include user ID in the state parameter
    auth_data = oauth.get_auth_url()
    # Encode user ID in state parameter
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

@router.post("/callback")
async def linkedin_callback(request: LinkedInCallbackRequest):
    """
    Handle LinkedIn OAuth callback and exchange code for access token
    """
    try:
        oauth = LinkedInOAuth()
        code = request.code
        state = request.state
        
        # Extract user ID from state parameter
        user_id = None
        if state:
            try:
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
@router.post("/post")
async def post_to_linkedin(
    current_user: Annotated[dict, Depends(get_current_user)],
    text: str = Form(...),
    image: UploadFile = File(None)
):
    """
    Post text and optional image to LinkedIn using OAuth token
    Requires authentication - uses the authenticated user's LinkedIn token
    """
    # Input validation
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Post text cannot be empty")
    
    if len(text) > 3000:  # LinkedIn post character limit
        raise HTTPException(status_code=400, detail="Post text exceeds maximum length of 3000 characters")
    
    # File validation
    if image:
        # Check file type first
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if image.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}")
        
        # Check file size (max 10MB) - read file to check size
        # Note: We need to read it anyway for upload, so this is acceptable
        file_content = await image.read()
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image file size exceeds 10MB limit")
        
        # Reset file pointer for later use
        await image.seek(0)
    
    try:
        # Get the authenticated user's LinkedIn token
        user_id = current_user["id"]
        token_data = await linkedin_supabase_service.get_linkedin_token(user_id)
        
        if not token_data:
            raise HTTPException(
                status_code=400, 
                detail="No LinkedIn account connected. Please connect your LinkedIn account first."
            )
        
        access_token = token_data["access_token"]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving token: {str(e)}")
    
    # Create LinkedIn service with OAuth token
    linkedin_service = LinkedInService(access_token=access_token)
    return await linkedin_service.post_to_linkedin(text, image)

@router.get("/status")
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

# LinkedIn post generation endpoint
@router.post("/generate-posts")
async def generate_linkedin_posts(
    request: LinkedInPostGenerationRequest,
    current_user: Annotated[dict, Depends(get_current_user)]
):
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
            detail="OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file"
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
        
        # Safely extract content with null safety
        posts_text = response.choices[0].message.content if response.choices and response.choices[0].message.content else ""
        
        if not posts_text:
            raise HTTPException(
                status_code=500,
                detail="OpenAI returned empty response. Please try again."
            )
        
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
        
        # Store hooks in database
        stored_record = None
        storage_error = None
        try:
            stored_record = await linkedin_supabase_service.store_generated_hooks(
                user_id=current_user["id"],
                hooks=cleaned_posts
            )
        except Exception as e:
            # Log error but don't fail the request
            storage_error = str(e)
            print(f"Warning: Failed to store hooks in database: {storage_error}")
        
        response = {
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
        
        # Include storage info if successful
        if stored_record:
            response["storage"] = {
                "id": stored_record.get("id"),
                "created_at": stored_record.get("created_at"),
                "stored": True
            }
        else:
            response["storage"] = {
                "stored": False,
                "error": storage_error
            }
        
        return response
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating posts: {str(e)}"
        )


@router.get("/hooks")
async def get_user_hooks(
    current_user: Annotated[dict, Depends(get_current_user)],
    limit: int = 10,
    offset: int = 0
):
    """
    Retrieve generated LinkedIn hooks for the authenticated user.
    
    Query Parameters:
    - limit: Number of records to return (default: 10, max: 50)
    - offset: Number of records to skip for pagination (default: 0)
    
    Returns:
    - List of hook generation records with metadata
    - Total count for pagination
    """
    try:
        # Validate parameters
        if limit < 1 or limit > 50:
            raise HTTPException(
                status_code=400,
                detail="Limit must be between 1 and 50"
            )
        
        if offset < 0:
            raise HTTPException(
                status_code=400,
                detail="Offset must be non-negative"
            )
        
        # Get hooks and total count
        hooks_data = await linkedin_supabase_service.get_user_hooks(
            user_id=current_user["id"],
            limit=limit,
            offset=offset
        )
        
        total_count = await linkedin_supabase_service.get_hooks_count(
            user_id=current_user["id"]
        )
        
        return {
            "success": True,
            "data": hooks_data,
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": total_count,
                "has_more": (offset + limit) < total_count
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving hooks: {str(e)}"
        )


