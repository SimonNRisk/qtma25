import httpx
import os
from fastapi import UploadFile
from typing import Optional, Tuple

class LinkedInService:
    def __init__(self, access_token=None):
        self.access_token = access_token or os.getenv('LINKEDIN_ACCESS_TOKEN')
        self.user_id = os.getenv('LINKEDIN_USER_ID', 'qzt-jTlMWM')
        
    async def upload_image_to_linkedin(self, image_file: UploadFile) -> Tuple[Optional[str], Optional[str]]:
        """
        Handle the 3-step LinkedIn image upload process
        Returns: (asset_urn, error_message)
        """
        try:
            # Step 1: Register upload request
            register_url = "https://api.linkedin.com/v2/assets?action=registerUpload"
            register_payload = {
                "registerUploadRequest": {
                    "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                    "owner": f"urn:li:person:{self.user_id}",
                    "serviceRelationships": [
                        {
                            "relationshipType": "OWNER",
                            "identifier": "urn:li:userGeneratedContent"
                        }
                    ]
                }
            }
            
            headers = {
                "Authorization": f"Bearer {self.access_token}",
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
    
    async def post_to_linkedin(self, text: str, image_file: Optional[UploadFile] = None) -> dict:
        """
        Post text and optional image to LinkedIn
        """
        try:
            linkedin_url = "https://api.linkedin.com/v2/ugcPosts"
            
            # Base payload
            payload = {
                "author": f"urn:li:person:{self.user_id}",
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
            if image_file:
                asset_urn, error = await self.upload_image_to_linkedin(image_file)
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
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            # Step 3: Post to LinkedIn
            async with httpx.AsyncClient() as client:
                response = await client.post(linkedin_url, json=payload, headers=headers)
                
                if response.status_code == 201:
                    response_data = response.json()
                    print(f"LinkedIn API Response: {response_data}")  # Debug logging
                    
                    # Try different possible ID fields
                    post_id = (response_data.get("id") or 
                              response_data.get("activity") or 
                              response_data.get("activityId") or
                              "unknown")
                    
                    return {
                        "id": post_id,
                        "message": "Post created successfully",
                        "linkedin_url": f"https://www.linkedin.com/feed/update/{post_id}",
                        "raw_response": response_data  # For debugging
                    }
                else:
                    return {"error": f"LinkedIn API error: {response.status_code} - {response.text}"}
                    
        except Exception as e:
            return {"error": f"Error posting to LinkedIn: {str(e)}"}
