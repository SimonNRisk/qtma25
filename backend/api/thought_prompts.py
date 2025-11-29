"""
Thought Prompts API Router

Provides endpoints for:
- GET /api/thought-prompts/current - Get the current active thought prompt
- GET /api/thought-prompts/random - Get a random active thought prompt
- POST /api/thought-prompts/respond - Submit a response to a thought prompt
- GET /api/thought-prompts/my-responses - Get user's previous responses
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
import logging

from auth import get_current_user
from services.thought_prompts_service import ThoughtPromptsService

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/thought-prompts", tags=["thought-prompts"])

# Initialize service
thought_prompts_service = ThoughtPromptsService()


# ============================================================================
# Pydantic Models
# ============================================================================

class ThoughtPrompt(BaseModel):
    """Response model for a thought prompt"""
    id: str
    question: str
    created_at: str


class ThoughtPromptResponse(BaseModel):
    """Response model for a user's response to a thought prompt"""
    id: str
    thought_prompt_id: str
    user_id: str
    response: str
    created_at: str
    updated_at: str
    # Include the prompt question for convenience
    question: Optional[str] = None


class SubmitResponseRequest(BaseModel):
    """Request model for submitting a response"""
    thought_prompt_id: str = Field(..., description="UUID of the thought prompt")
    response: str = Field(..., min_length=1, max_length=5000, description="User's response text")


class SubmitResponseResult(BaseModel):
    """Response model for submit response endpoint"""
    success: bool
    message: str
    data: Optional[ThoughtPromptResponse] = None


class GetPromptResult(BaseModel):
    """Response model for get prompt endpoints"""
    success: bool
    data: Optional[ThoughtPrompt] = None
    has_responded: bool = False
    existing_response: Optional[str] = None


class GetResponsesResult(BaseModel):
    """Response model for get my responses endpoint"""
    success: bool
    data: List[ThoughtPromptResponse]
    count: int


# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/current", response_model=GetPromptResult)
async def get_current_thought_prompt(
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """
    Get the current active thought prompt.
    
    Returns the most recently created active thought prompt.
    Also indicates if the user has already responded to this prompt.
    
    Returns:
        - success: Whether the request was successful
        - data: The thought prompt (id, question, created_at)
        - has_responded: Whether the current user has already responded
        - existing_response: The user's existing response text (if any)
    """
    try:
        user_id = current_user["id"]
        
        # Get the current prompt
        prompt = await thought_prompts_service.get_current_prompt()
        
        if not prompt:
            return GetPromptResult(
                success=True,
                data=None,
                has_responded=False,
                existing_response=None
            )
        
        # Check if user has already responded
        existing_response = await thought_prompts_service.get_user_response_for_prompt(
            user_id=user_id,
            thought_prompt_id=prompt["id"]
        )
        
        return GetPromptResult(
            success=True,
            data=ThoughtPrompt(
                id=prompt["id"],
                question=prompt["question"],
                created_at=prompt["created_at"]
            ),
            has_responded=existing_response is not None,
            existing_response=existing_response["response"] if existing_response else None
        )
        
    except Exception as e:
        logger.error(f"Error getting current thought prompt: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving thought prompt: {str(e)}"
        )


@router.get("/random", response_model=GetPromptResult)
async def get_random_thought_prompt(
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """
    Get a random active thought prompt.
    
    Useful for showing variety to users or refreshing the prompt.
    Also indicates if the user has already responded to this prompt.
    
    Returns:
        - success: Whether the request was successful
        - data: The thought prompt (id, question, created_at)
        - has_responded: Whether the current user has already responded
        - existing_response: The user's existing response text (if any)
    """
    try:
        user_id = current_user["id"]
        
        # Get a random prompt
        prompt = await thought_prompts_service.get_random_prompt()
        
        if not prompt:
            return GetPromptResult(
                success=True,
                data=None,
                has_responded=False,
                existing_response=None
            )
        
        # Check if user has already responded
        existing_response = await thought_prompts_service.get_user_response_for_prompt(
            user_id=user_id,
            thought_prompt_id=prompt["id"]
        )
        
        return GetPromptResult(
            success=True,
            data=ThoughtPrompt(
                id=prompt["id"],
                question=prompt["question"],
                created_at=prompt["created_at"]
            ),
            has_responded=existing_response is not None,
            existing_response=existing_response["response"] if existing_response else None
        )
        
    except Exception as e:
        logger.error(f"Error getting random thought prompt: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving thought prompt: {str(e)}"
        )


@router.post("/respond", response_model=SubmitResponseResult)
async def submit_response(
    request: SubmitResponseRequest,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """
    Submit or update a response to a thought prompt.
    
    If the user has already responded to this prompt, their response will be updated.
    Otherwise, a new response will be created.
    
    Request Body:
        - thought_prompt_id: UUID of the thought prompt
        - response: The user's response text (1-5000 characters)
    
    Returns:
        - success: Whether the request was successful
        - message: Status message
        - data: The stored/updated response
    """
    try:
        user_id = current_user["id"]
        
        # Validate that the thought prompt exists
        prompt = await thought_prompts_service.get_prompt_by_id(request.thought_prompt_id)
        if not prompt:
            raise HTTPException(
                status_code=404,
                detail="Thought prompt not found"
            )
        
        # Validate response is not empty after stripping whitespace
        response_text = request.response.strip()
        if not response_text:
            raise HTTPException(
                status_code=400,
                detail="Response cannot be empty"
            )
        
        # Submit or update the response
        result = await thought_prompts_service.submit_response(
            user_id=user_id,
            thought_prompt_id=request.thought_prompt_id,
            response=response_text
        )
        
        return SubmitResponseResult(
            success=True,
            message="Response submitted successfully",
            data=ThoughtPromptResponse(
                id=result["id"],
                thought_prompt_id=result["thought_prompt_id"],
                user_id=result["user_id"],
                response=result["response"],
                created_at=result["created_at"],
                updated_at=result["updated_at"],
                question=prompt["question"]
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting response: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error submitting response: {str(e)}"
        )


@router.get("/my-responses", response_model=GetResponsesResult)
async def get_my_responses(
    current_user: Annotated[dict, Depends(get_current_user)],
    limit: int = 10,
    offset: int = 0
):
    """
    Get the current user's responses to thought prompts.
    
    Query Parameters:
        - limit: Maximum number of responses to return (default: 10, max: 50)
        - offset: Number of records to skip for pagination (default: 0)
    
    Returns:
        - success: Whether the request was successful
        - data: List of responses with associated prompt questions
        - count: Total number of responses
    """
    try:
        user_id = current_user["id"]
        
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
        
        # Get responses with prompt questions
        responses = await thought_prompts_service.get_user_responses(
            user_id=user_id,
            limit=limit,
            offset=offset
        )
        
        # Get total count
        total_count = await thought_prompts_service.get_user_responses_count(user_id)
        
        return GetResponsesResult(
            success=True,
            data=[
                ThoughtPromptResponse(
                    id=r["id"],
                    thought_prompt_id=r["thought_prompt_id"],
                    user_id=r["user_id"],
                    response=r["response"],
                    created_at=r["created_at"],
                    updated_at=r["updated_at"],
                    question=r.get("question")
                )
                for r in responses
            ],
            count=total_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user responses: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving responses: {str(e)}"
        )

