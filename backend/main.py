from fastapi import FastAPI, File, UploadFile, Form
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

# LinkedIn image upload helper
async def upload_image_to_linkedin(image_file: UploadFile):
    """
    Handle the 3-step LinkedIn image upload process
    """
    try:
        # Step 1: Register upload request
        register_url = "https://api.linkedin.com/v2/assets?action=registerUpload"
        register_payload = {
            "registerUploadRequest": {
                "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                "owner": f"urn:li:person:{os.getenv('LINKEDIN_USER_ID')}",
                "serviceRelationships": [
                    {
                        "relationshipType": "OWNER",
                        "identifier": "urn:li:userGeneratedContent"
                    }
                ]
            }
        }
        
        headers = {
            "Authorization": f"Bearer {os.getenv('LINKEDIN_ACCESS_TOKEN')}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
        }
        
        async with httpx.AsyncClient() as client:
            # Step 1: Register upload
            register_response = await client.post(register_url, json=register_payload, headers=headers)
            
            if register_response.status_code != 200:
                return None, f"Register upload failed: {register_response.text}"
            
            register_data = register_response.json()
            upload_url = register_data["value"]["uploadMechanism"]["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]["uploadUrl"]
            asset_urn = register_data["value"]["asset"]
            
            # Step 2: Upload image
            image_content = await image_file.read()
            upload_headers = {
                "media-type-family": "STILLIMAGE"
            }
            
            upload_response = await client.put(upload_url, content=image_content, headers=upload_headers)
            
            if upload_response.status_code not in [200, 201]:
                return None, f"Image upload failed: {upload_response.text}"
            
            return asset_urn, None
            
    except Exception as e:
        return None, f"Image upload error: {str(e)}"

# LinkedIn post endpoint with image support
@app.post("/api/linkedin/post")
async def post_to_linkedin(
    text: str = Form(...),
    image: UploadFile = File(None)
):
    """
    Post text and optional image to LinkedIn
    """
    try:
        linkedin_url = "https://api.linkedin.com/v2/ugcPosts"
        
        # Base payload
        payload = {
            "author": f"urn:li:person:{os.getenv('LINKEDIN_USER_ID')}",
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {
                        "text": text
                    },
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        }
        
        # Handle image upload if provided
        if image:
            asset_urn, error = await upload_image_to_linkedin(image)
            if error:
                return {"error": error}
            
            # Update payload for image post
            payload["specificContent"]["com.linkedin.ugc.ShareContent"]["shareMediaCategory"] = "IMAGE"
            payload["specificContent"]["com.linkedin.ugc.ShareContent"]["media"] = [
                {
                    "status": "READY",
                    "description": {"text": "Uploaded image"},
                    "media": asset_urn,
                    "title": {"text": "Image post"}
                }
            ]
        
        headers = {
            "Authorization": f"Bearer {os.getenv('LINKEDIN_ACCESS_TOKEN')}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
        }
        
        # Step 3: Post to LinkedIn
        async with httpx.AsyncClient() as client:
            response = await client.post(linkedin_url, json=payload, headers=headers)
            
            if response.status_code == 201:
                return {"id": response.json().get("id"), "message": "Post created successfully"}
            else:
                return {"error": f"LinkedIn API error: {response.status_code} - {response.text}"}
                
    except Exception as e:
        return {"error": f"Error posting to LinkedIn: {str(e)}"}

