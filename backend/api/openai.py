from fastapi import APIRouter, Request, HTTPException, status, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import OpenAI
import os
import re
import json
from dotenv import load_dotenv
from typing import Annotated, Optional, AsyncGenerator
from auth import get_current_user
from linkedin_supabase_service import SupabaseService
from utils.rate_limit import openai_rate_limiter, get_client_ip

load_dotenv()

router = APIRouter(prefix="/api/openai", tags=["openai"])

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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
    if not openai_rate_limiter.check_rate_limit(client_ip):
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
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        max_tokens=800,
    )
    post_text = response.choices[0].message.content
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
    if not client:
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

CRITICAL: Each post must start immediately with the post content - do NOT prefix posts with numbers (like "1." or "Post 1:"), titles / headings, or labels. Separate posts with blank lines.
"""
    
    try:
        response = client.chat.completions.create(
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

@router.post("/generate-posts-stream")
async def generate_linkedin_posts_stream(
    request: LinkedInPostGenerationRequest,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """
    Generate multiple LinkedIn post hooks/content using OpenAI with streaming.
    Streams hooks as they are generated, allowing for real-time display.
    
    Parameters:
    - quantity: Number of posts to generate (default: 10, minimum: 3)
    - context: Optional user context to personalize posts
    - length: Post length - 1=short (~150 words), 2=medium (~300 words), 3=long (~500 words)
    - tone: Optional tone (professional, casual, friendly, etc.)
    - audience: Optional specific audience targeting
    
    Returns a Server-Sent Events (SSE) stream with hooks as they're generated.
    """
    # Validate OpenAI API key
    if not client:
        raise HTTPException(
            status_code=500, 
            detail="OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file"
        )
    
    # Cap quantity at 3 for conversational style
    max_quantity = min(request.quantity, 3)
    
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
        context_part = f"\n\nUser's request: {request.context}"
    else:
        context_part = "\n\nUser's request: Not provided. Create generic but engaging startup-focused content."
    
    tone_part = ""
    if request.tone:
        tone_part = f"\nTone: {request.tone}"
    
    audience_part = ""
    if request.audience:
        audience_part = f"\nTarget Audience: {request.audience}"
    
    system_prompt = f"""You are a helpful and conversational LinkedIn content assistant. Your role is to have a natural conversation with the user about their content request, then provide personalized LinkedIn post hooks.

Your response should follow this structure:
1. First, have a brief conversational response (2-3 sentences) discussing what the user is asking about and why it's interesting or relevant.
2. Then, generate exactly {max_quantity} LinkedIn post hooks in first-person, opinion-based style. Each hook should be approximately {target_words} words.{context_part}{tone_part}{audience_part}

Hook Requirements:
- Write in first person ("I think...", "In my opinion...", "I've noticed...")
- Be conversational and authentic, like you're sharing a personal take
- Each hook should be UNIQUE in approach (storytelling, tips, thought leadership, questions, case studies, personal anecdotes, etc.)
- Make them engaging and designed to get traction for startup founders/entrepreneurs
- Include relevant hashtags at the end of each hook (3-5 hashtags)
- Make hooks actionable and valuable
- Each hook should stand alone

CRITICAL FORMATTING:
- Start your conversational response immediately
- After your conversational intro, write "---" on a new line
- Then list each hook, separated by exactly TWO newlines (\\n\\n)
- Each hook must start immediately with the content - do NOT prefix with numbers, titles, or labels like "Hook 1:" or "1."
"""
    
    async def generate_stream() -> AsyncGenerator[str, None]:
        try:
            user_message = request.context if request.context else "Generate some LinkedIn post ideas for me."
            
            stream = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.9,
                max_tokens=4000 if request.length == 3 else 2500 if request.length == 2 else 1500,
                stream=True
            )
            
            current_post = ""
            accumulated_text = ""
            post_count = 0
            in_hooks_section = False
            conversation_text = ""
            
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    accumulated_text += content
                    
                    # Check if we've reached the separator "---" to start parsing hooks
                    if not in_hooks_section and "---" in accumulated_text:
                        # Split at the separator
                        parts = accumulated_text.split("---", 1)
                        if len(parts) == 2:
                            conversation_text = parts[0].strip()
                            # Clean up the hooks section - remove leading whitespace/newlines
                            hooks_section = parts[1].lstrip()
                            current_post = hooks_section
                            in_hooks_section = True
                            # Send the conversational part as a message
                            yield f"data: {json.dumps({'type': 'conversation', 'content': conversation_text})}\n\n"
                            # Continue processing the hook content
                            if "\n\n" in current_post:
                                hook_parts = current_post.split("\n\n", 1)
                                if len(hook_parts) == 2:
                                    completed_hook = hook_parts[0].strip()
                                    # Remove any leading newlines or whitespace
                                    completed_hook = re.sub(r'^[\n\r\s]+', '', completed_hook)
                                    if completed_hook and len(completed_hook) > 10:
                                        cleaned = re.sub(r'^(\d+\.\s*|Hook\s+\d+:\s*)', '', completed_hook, flags=re.IGNORECASE)
                                        cleaned = cleaned.strip()
                                        if cleaned:
                                            post_count += 1
                                            yield f"data: {json.dumps({'type': 'hook', 'content': cleaned, 'index': post_count})}\n\n"
                                    # Clean up remainder too
                                    current_post = hook_parts[1].lstrip()
                        else:
                            # Still in conversation, send as chunk with section indicator
                            yield f"data: {json.dumps({'type': 'chunk', 'content': content, 'section': 'conversation'})}\n\n"
                    elif in_hooks_section:
                        # We're in the hooks section, parse hooks
                        current_post += content
                        
                        # Check if we've completed a hook (two newlines)
                        if "\n\n" in current_post:
                            parts = current_post.split("\n\n", 1)
                            if len(parts) == 2:
                                completed_hook = parts[0].strip()
                                # Remove any leading newlines, whitespace, or prefixes
                                completed_hook = re.sub(r'^[\n\r\s]+', '', completed_hook)
                                if completed_hook and len(completed_hook) > 10:
                                    # Clean up any leading prefixes
                                    cleaned = re.sub(r'^(\d+\.\s*|Hook\s+\d+:\s*)', '', completed_hook, flags=re.IGNORECASE)
                                    cleaned = cleaned.strip()
                                    
                                    if cleaned:
                                        post_count += 1
                                        # Send the completed hook
                                        yield f"data: {json.dumps({'type': 'hook', 'content': cleaned, 'index': post_count})}\n\n"
                                
                                # Keep the remainder for the next hook, clean it up
                                remainder = parts[1].lstrip()
                                current_post = remainder
                                
                                # Only send chunks for the remainder (next hook being built), not the completed hook
                                # This ensures streaming content is only shown for the current hook
                                if remainder:
                                    yield f"data: {json.dumps({'type': 'chunk', 'content': remainder, 'section': 'hook'})}\n\n"
                        else:
                            # No separator yet, send chunk for current hook being built
                            yield f"data: {json.dumps({'type': 'chunk', 'content': content, 'section': 'hook'})}\n\n"
                    else:
                        # Still in conversation section
                        yield f"data: {json.dumps({'type': 'chunk', 'content': content, 'section': 'conversation'})}\n\n"
            
            # Handle any remaining hook content
            if in_hooks_section and current_post.strip() and len(current_post.strip()) > 10:
                # Remove any leading newlines or whitespace
                remaining_hook = re.sub(r'^[\n\r\s]+', '', current_post.strip())
                cleaned = re.sub(r'^(\d+\.\s*|Hook\s+\d+:\s*)', '', remaining_hook, flags=re.IGNORECASE)
                cleaned = cleaned.strip()
                if cleaned:
                    post_count += 1
                    yield f"data: {json.dumps({'type': 'hook', 'content': cleaned, 'index': post_count})}\n\n"
            
            # Store all hooks in database
            try:
                # Parse hooks from accumulated text (after the "---" separator)
                if "---" in accumulated_text:
                    hooks_section = accumulated_text.split("---", 1)[1].lstrip()
                    all_posts = [p.strip() for p in hooks_section.split('\n\n') if p.strip() and len(p.strip()) > 10]
                else:
                    # Fallback: parse all posts
                    all_posts = [p.strip() for p in accumulated_text.split('\n\n') if p.strip() and len(p.strip()) > 10]
                
                cleaned_posts = []
                for post in all_posts:
                    # Remove leading newlines/whitespace
                    post = re.sub(r'^[\n\r\s]+', '', post)
                    # Remove prefixes
                    cleaned = re.sub(r'^(\d+\.\s*|Hook\s+\d+:\s*|Post\s+\d+:\s*)', '', post, flags=re.IGNORECASE)
                    cleaned = cleaned.strip()
                    if cleaned:
                        cleaned_posts.append(cleaned)
                
                if cleaned_posts:
                    stored_record = await linkedin_supabase_service.store_generated_hooks(
                        user_id=current_user["id"],
                        hooks=cleaned_posts
                    )
                    yield f"data: {json.dumps({'type': 'complete', 'stored': True, 'count': len(cleaned_posts)})}\n\n"
                else:
                    yield f"data: {json.dumps({'type': 'complete', 'stored': False, 'count': 0})}\n\n"
            except Exception as e:
                print(f"Warning: Failed to store hooks in database: {str(e)}")
                yield f"data: {json.dumps({'type': 'complete', 'stored': False, 'error': str(e)})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )