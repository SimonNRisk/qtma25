from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI

router = APIRouter()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class FirstPostRequest(BaseModel):
    # all of the onboarding data

class FirstPostResponse(BaseModel):
    post_username: str
    post_user_title: str
    post_text: str
