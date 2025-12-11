import os
from typing import Annotated

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from config import get_cors_origins

# Routers
from auth import auth_router, get_current_user
from api.openai import router as openai_router
from api.linkedin import router as linkedin_router
from api.hooks import router as hooks_router
from api.onboarding import router as onboarding_router
from api.news import router as news_router
from api.thought_prompts import router as thought_prompts_router
from api.documents import router as documents_router
from api.memory import router as memory_router
# Load environment variables
load_dotenv()

app = FastAPI()

# Enable CORS so frontend can talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Schemas ----------
class ProfileBody(BaseModel):
    first_name: str = ""
    last_name: str = ""

# Include auth router
app.include_router(auth_router)
app.include_router(openai_router)
app.include_router(linkedin_router)
app.include_router(hooks_router)
app.include_router(onboarding_router)
app.include_router(news_router)
app.include_router(thought_prompts_router)
app.include_router(documents_router)
app.include_router(memory_router)
# ---------- Routes ----------
@app.get("/me")
def get_current_user_profile(current_user: Annotated[dict, Depends(get_current_user)]):
    """Get current user's profile information"""
    return {"user": current_user}
@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}
