from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Tuple

load_dotenv()

router = APIRouter(prefix="/api/openai", tags=["openai"])

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Simple in-memory rate limiter: IP -> (count, reset_time)
rate_limit_store: Dict[str, Tuple[int, datetime]] = defaultdict(lambda: (0, datetime.now()))

# Rate limit: 10 requests per hour per IP
RATE_LIMIT_MAX_REQUESTS = 10
RATE_LIMIT_WINDOW_SECONDS = 3600  # 1 hour

def check_rate_limit(ip: str) -> bool:
    """Check if IP has exceeded rate limit. Returns True if allowed, False if rate limited."""
    now = datetime.now()
    count, reset_time = rate_limit_store[ip]
    
    # Reset if window has passed
    if now >= reset_time:
        rate_limit_store[ip] = (1, now + timedelta(seconds=RATE_LIMIT_WINDOW_SECONDS))
        return True
    
    # Check if limit exceeded
    if count >= RATE_LIMIT_MAX_REQUESTS:
        return False
    
    # Increment count
    rate_limit_store[ip] = (count + 1, reset_time)
    return True

def get_client_ip(request: Request) -> str:
    """Get client IP address from request."""
    # Check for forwarded IP (if behind proxy)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

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

@router.post("/first-post", response_model=FirstPostResponse)
async def generate_first_post(
    request: FirstPostRequest,
    http_request: Request
):
    # Rate limiting check
    client_ip = get_client_ip(http_request)
    if not check_rate_limit(client_ip):
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