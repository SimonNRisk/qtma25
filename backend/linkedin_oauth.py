import httpx
import os
import secrets
from typing import Dict, Any

class LinkedInOAuth:
    def __init__(self):
        self.client_id = os.getenv('LINKEDIN_CLIENT_ID')
        self.client_secret = os.getenv('LINKEDIN_CLIENT_SECRET')
        self.redirect_uri = os.getenv('LINKEDIN_REDIRECT_URI', 'http://localhost:3000/linkedin-connect/callback')
        self.scope = 'w_member_social profile email openid'
        
    def get_auth_url(self) -> Dict[str, str]:
        """Generate LinkedIn OAuth authorization URL"""
        state = secrets.token_urlsafe(32)
        
        auth_url = (
            f"https://www.linkedin.com/oauth/v2/authorization?"
            f"response_type=code&"
            f"client_id={self.client_id}&"
            f"redirect_uri={self.redirect_uri}&"
            f"state={state}&"
            f"scope={self.scope}"
        )
        
        return {"auth_url": auth_url, "state": state}
    
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        token_url = "https://www.linkedin.com/oauth/v2/accessToken"
        
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.redirect_uri,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data)
            
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Token exchange failed: {response.text}")
    
    async def get_user_profile(self, access_token: str) -> Dict[str, Any]:
        """Get user's LinkedIn profile information using OpenID Connect"""
        profile_url = "https://api.linkedin.com/v2/userinfo"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "X-Restli-Protocol-Version": "2.0.0"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(profile_url, headers=headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Profile fetch failed: {response.text}")
