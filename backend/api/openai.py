from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
from typing import Annotated
from fastapi import Depends
import os
from dotenv import load_dotenv

from auth import get_current_user

load_dotenv()

router = APIRouter(prefix="/api/openai", tags=["openai"])

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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

# Gets current user from JWT token (Authorization header) before generating the post
@router.post("/first-post", response_model=FirstPostResponse)
async def generate_first_post(
    request: FirstPostRequest,
    current_user: Annotated[dict, Depends(get_current_user)]
):
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
    return FirstPostResponse(post_text=post_text)