from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from dotenv import load_dotenv
from pydantic import BaseModel

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI()

# Enable CORS so frontend can talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base route (not used at the moment)
@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}

# Example route (for demo of how this works)
@app.get("/api/hello")
def say_hello():
    return {"message": "Hello from /api/hello"}

# Pydantic model for request body
class PostRequest(BaseModel):
    text: str

# Simple LinkedIn post endpoint
@app.post("/api/linkedin/post")
async def post_to_linkedin(request: PostRequest):
    """
    Post a custom message to LinkedIn
    """
    try:
        linkedin_url = "https://api.linkedin.com/v2/ugcPosts"
        
        payload = {
            "author": f"urn:li:person:{os.getenv('LINKEDIN_USER_ID')}",
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {
                        "text": request.text
                    },
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "CONNECTIONS"
            }
        }
        
        headers = {
            "Authorization": f"Bearer {os.getenv('LINKEDIN_ACCESS_TOKEN')}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
        }
        
        # Make request to LinkedIn API
        async with httpx.AsyncClient() as client:
            response = await client.post(linkedin_url, json=payload, headers=headers)
            
            if response.status_code == 201:
                return {"id": response.json().get("id"), "message": "Demo post created successfully"}
            else:
                return {"error": f"LinkedIn API error: {response.status_code} - {response.text}"}
                
    except Exception as e:
        return {"error": f"Error posting to LinkedIn: {str(e)}"}
