"""
LLM-backed generation API (first-post, generate-posts).
Provider-agnostic route surface; implementation may use any model provider.
"""
from fastapi import APIRouter, Request, HTTPException, status, Depends
from pydantic import BaseModel
import anthropic
import os
from dotenv import load_dotenv
from typing import Annotated, Optional
from auth import get_current_user
from linkedin_supabase_service import SupabaseService
from utils.rate_limit import llm_rate_limiter, get_client_ip

load_dotenv()

router = APIRouter(prefix="/api/llm", tags=["llm"])

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Initialize LinkedIn Supabase service for storing generated hooks
linkedin_supabase_service = SupabaseService()


class FirstPostRequest(BaseModel):
    full_name: str
    role: str
    company: str
    core_mission: str
    target_audience: str
    specific_topics: str
    selected_goals: list[str]
    selected_hooks: list[str]


class FirstPostResponse(BaseModel):
    post_text: str


class LinkedInPostGenerationRequest(BaseModel):
    quantity: int = 10
    context: Optional[str] = None
    length: int = 2  # 1=short, 2=medium, 3=long
    tone: Optional[str] = None  # Optional: professional, casual, friendly, etc.
    audience: Optional[str] = None  # Optional: more specific audience targeting


@router.post("/first-post", response_model=FirstPostResponse)
async def generate_first_post(
    request: FirstPostRequest,
    http_request: Request
):
    # Rate limiting check
    client_ip = get_client_ip(http_request)
    if not llm_rate_limiter.check_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later."
        )
    system_prompt = (
        "You are an expert LinkedIn ghostwriter. "
        "Write engaging, professional posts that feel authentic to the person."
    )
    user_prompt = (
        f"""
        Generate a first-person LinkedIn post for the following user:
        Full Name: {request.full_name}
        Role: {request.role}
        Company: {request.company}
        Core Mission: {request.core_mission}
        Target Audience: {request.target_audience}
        Specific Topics: {request.specific_topics}
        Selected Goals: {", ".join(request.selected_goals)}
        Selected Hooks: {", ".join(request.selected_hooks)}

        Post Requirements:
        - Tone: warm, confident, and credible (no cringe, no buzzword soup).
        - Keep it within normal LinkedIn length (150–250 words is fine).
        - Use short paragraphs, no emoji nor em-dashes.
        - Do NOT include hashtags or mentions.
        """
    )
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=800,
        system=system_prompt,
        messages=[
            {"role": "user", "content": user_prompt}
        ],
    )
    post_text = response.content[0].text
    if not post_text:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate post content"
        )
    return FirstPostResponse(post_text=post_text)


@router.post("/generate-posts")
async def generate_linkedin_posts(
    request: LinkedInPostGenerationRequest,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """
    Generate multiple LinkedIn post hooks/content using the configured LLM.

    Parameters:
    - quantity: Number of posts to generate (default: 10, minimum: 3)
    - context: Optional user context to personalize posts (default: null for generic posts)
    - length: Post length - 1=short (~150 words), 2=medium (~300 words), 3=long (~500 words) (default: 2)
    - tone: Optional tone (professional, casual, friendly, etc.)
    - audience: Optional specific audience targeting

    Returns a list of unique LinkedIn post suggestions in different styles.
    """
    # Validate LLM API key
    if not client:
        raise HTTPException(
            status_code=500,
            detail="LLM API key not configured. Please set ANTHROPIC_API_KEY in your .env file"
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

CRITICAL: Each post must start immediately with the post content - do NOT prefix posts with numbers (like "1." or "Post 1:"), titles / headings, or labels. Separate posts with blank lines.
"""

    try:
        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=4000 if request.length == 3 else 2500 if request.length == 2 else 1500,
            temperature=0.9,  # Higher temperature for more creative and varied outputs
            system=system_prompt,
            messages=[
                {"role": "user", "content": f"Generate {request.quantity} unique LinkedIn posts with different styles."}
            ],
        )

        # Safely extract content with null safety
        posts_text = response.content[0].text if response.content and len(response.content) > 0 else ""

        if not posts_text:
            raise HTTPException(
                status_code=500,
                detail="LLM returned empty response. Please try again."
            )

        # Parse the posts (split by blank lines)
        posts_list = [p.strip() for p in posts_text.split('\n\n') if p.strip()]

        # Simple cleanup - just remove leading prefixes like "1.", "Post 1:", etc.
        cleaned_posts = []
        for post in posts_list:
            if post.strip():
                post = post.strip()
                if post and len(post) > 10:
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
