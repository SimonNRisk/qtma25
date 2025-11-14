from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated
from pydantic import BaseModel
from auth import get_current_user
from linkedin_supabase_service import SupabaseService

router = APIRouter(prefix="/api/hooks", tags=["hooks"])

linkedin_supabase_service = SupabaseService()

# Pydantic models
class BookmarkHookRequest(BaseModel):
    hook: str

@router.get("/get-user-hooks")
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

@router.post("/bookmark-hook")
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


