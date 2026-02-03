from fastapi import APIRouter, HTTPException, Depends, Form, File, UploadFile
from pydantic import BaseModel
import os
import base64
import json
from dotenv import load_dotenv
from typing import Optional, Annotated
from linkedin_supabase_service import SupabaseService
from linkedin_oauth import LinkedInOAuth
from linkedin_service import LinkedInService
from auth import get_current_user

load_dotenv()

router = APIRouter(prefix="/api/linkedin", tags=["linkedin"])

# Initialize LinkedIn Supabase service
linkedin_supabase_service = SupabaseService()

# Pydantic models
class LinkedInCallbackRequest(BaseModel):
    code: str
    state: Optional[str] = None

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
        refresh_token = token_data.get("refresh_token")
        
        if not access_token:
            raise HTTPException(status_code=500, detail="Failed to obtain access token from LinkedIn")
        
        # Get user profile
        profile_data = await oauth.get_user_profile(access_token)
        
        # Store token in Supabase using the authenticated user's ID
        storage_success = await linkedin_supabase_service.store_linkedin_token(
            user_id, 
            access_token, 
            profile_data,
            refresh_token=refresh_token
        )
        
        if not storage_success:
            raise HTTPException(
                status_code=500, 
                detail="Failed to store LinkedIn token. Please try again."
            )
        
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
