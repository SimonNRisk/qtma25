from fastapi import APIRouter, HTTPException, Depends, Form, File, UploadFile
from pydantic import BaseModel
import os
import base64
import json
from dotenv import load_dotenv
from typing import Optional, Annotated, List, Dict, Any
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

class BookmarkHookRequest(BaseModel):
    hook: str

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

@router.post("/hooks/bookmark")
async def bookmark_hook(
    request: BookmarkHookRequest,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """
    Bookmark a single hook by saving it to the database.
    
    Request Body:
    - hook: The hook text to bookmark
    
    Returns:
    - Success status and stored record
    """
    try:
        if not request.hook or not request.hook.strip():
            raise HTTPException(
                status_code=400,
                detail="Hook text is required and must be a non-empty string"
            )
        
        # Store the single hook using the existing service method
        stored_record = await linkedin_supabase_service.store_generated_hooks(
            user_id=current_user["id"],
            hooks=[request.hook.strip()]
        )
        
        return {
            "success": True,
            "message": "Hook bookmarked successfully",
            "data": stored_record
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error bookmarking hook: {str(e)}"
        )


