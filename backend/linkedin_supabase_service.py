import os
from supabase import create_client, Client
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

class SupabaseService:
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
    
    async def store_linkedin_token(self, user_id: str, access_token: str, profile_data: Dict[str, Any], refresh_token: Optional[str] = None) -> bool:
        """
        Store LinkedIn OAuth token in Supabase
        """
        try:
            # Calculate expiration (LinkedIn tokens typically last 60 days)
            expires_at = datetime.utcnow() + timedelta(days=60)
            
            # Check if user already has a token
            existing = self.supabase.table('linkedin_tokens').select('*').eq('user_id', user_id).execute()
            
            token_data = {
                'user_id': user_id,
                'access_token': access_token,
                'refresh_token': refresh_token,
                'expires_at': expires_at.isoformat(),
                'profile_data': profile_data,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            if existing.data:
                # Update existing token
                result = self.supabase.table('linkedin_tokens').update(token_data).eq('user_id', user_id).execute()
            else:
                # Insert new token
                token_data['created_at'] = datetime.utcnow().isoformat()
                result = self.supabase.table('linkedin_tokens').insert(token_data).execute()
            
            return len(result.data) > 0
            
        except Exception as e:
            print(f"Error storing LinkedIn token: {e}")
            return False
    
    async def get_linkedin_token(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get LinkedIn OAuth token from Supabase
        """
        try:
            result = self.supabase.table('linkedin_tokens').select('*').eq('user_id', user_id).execute()
            
            if result.data:
                token_data = result.data[0]
                
                # Check if token is expired
                expires_at = datetime.fromisoformat(token_data['expires_at'].replace('Z', '+00:00'))
                if datetime.utcnow().replace(tzinfo=expires_at.tzinfo) > expires_at:
                    print(f"Token expired for user {user_id}")
                    return None
                
                return token_data
            
            return None
            
        except Exception as e:
            print(f"Error retrieving LinkedIn token: {e}")
            return None
    
    async def delete_linkedin_token(self, user_id: str) -> bool:
        """
        Delete LinkedIn OAuth token from Supabase
        """
        try:
            result = self.supabase.table('linkedin_tokens').delete().eq('user_id', user_id).execute()
            return len(result.data) > 0
            
        except Exception as e:
            print(f"Error deleting LinkedIn token: {e}")
            return False
