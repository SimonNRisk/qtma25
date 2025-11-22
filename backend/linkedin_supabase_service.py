import os
from supabase import create_client, Client
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import logging

# Configure logging
logger = logging.getLogger(__name__)

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
    
    # LinkedIn Hooks Storage Methods
    
    async def store_generated_hooks(
        self,
        user_id: str,
        hooks: List[str]
    ) -> Dict[str, Any]:
        """
        Store AI-generated LinkedIn hooks for a user.
        
        Args:
            user_id: UUID of the user
            hooks: List of generated hook strings
            
        Returns:
            Dict containing the stored record with id, created_at, etc.
            
        Raises:
            ValueError: If hooks list is empty or invalid
            Exception: If database operation fails
        """
        # Validation
        if not hooks or not isinstance(hooks, list):
            raise ValueError("Hooks must be a non-empty list")
        
        if not all(isinstance(hook, str) and hook.strip() for hook in hooks):
            raise ValueError("All hooks must be non-empty strings")
        
        if len(hooks) > 20:
            raise ValueError("Maximum 20 hooks allowed per generation")
        
        try:
            now_iso = datetime.utcnow().isoformat()
            
            # Prepare payload
            payload = {
                'user_id': user_id,
                'hooks': hooks,
                'hook_count': len(hooks),
                'updated_at': now_iso,
            }
            
            # Insert new record (each generation is a new record)
            payload['created_at'] = now_iso
            result = self.supabase.table('linkedin_generated_hooks').insert(payload).execute()
            
            if not result.data or len(result.data) == 0:
                raise Exception("Database returned no data after insert")
            
            logger.info(f"Successfully stored {len(hooks)} hooks for user {user_id}")
            return result.data[0]
            
        except ValueError as ve:
            logger.error(f"Validation error storing hooks: {ve}")
            raise
        except Exception as e:
            logger.error(f"Error storing generated hooks for user {user_id}: {e}")
            raise Exception(f"Failed to store hooks: {str(e)}")
    
    async def get_user_hooks(
        self,
        user_id: str,
        limit: int = 10,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Retrieve generated hooks for a user with pagination.
        
        Args:
            user_id: UUID of the user
            limit: Maximum number of records to return (default 10, max 50)
            offset: Number of records to skip for pagination
            
        Returns:
            List of hook generation records, ordered by created_at DESC
            
        Raises:
            ValueError: If parameters are invalid
            Exception: If database operation fails
        """
        # Validation
        if limit < 1 or limit > 50:
            raise ValueError("Limit must be between 1 and 50")
        
        if offset < 0:
            raise ValueError("Offset must be non-negative")
        
        try:
            result = (
                self.supabase
                .table('linkedin_generated_hooks')
                .select('*')
                .eq('user_id', user_id)
                .order('created_at', desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )
            
            logger.info(f"Retrieved {len(result.data) if result.data else 0} hook records for user {user_id}")
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Error retrieving hooks for user {user_id}: {e}")
            raise Exception(f"Failed to retrieve hooks: {str(e)}")
    
    async def get_hooks_count(self, user_id: str) -> int:
        """
        Get the total number of hook generations for a user.
        
        Args:
            user_id: UUID of the user
            
        Returns:
            Integer count of hook generation records
            
        Raises:
            Exception: If database operation fails
        """
        try:
            result = (
                self.supabase
                .table('linkedin_generated_hooks')
                .select('id', count='exact')
                .eq('user_id', user_id)
                .execute()
            )
            
            count = result.count if hasattr(result, 'count') and result.count is not None else 0
            logger.info(f"User {user_id} has {count} hook generations")
            return count
            
        except Exception as e:
            logger.error(f"Error counting hooks for user {user_id}: {e}")
            raise Exception(f"Failed to count hooks: {str(e)}")
    
    # News Hooks Storage Methods
    
    async def store_news_hooks(
        self,
        industry: str,
        industry_slug: str,
        summary: str,
        hooks: List[str]
    ) -> Dict[str, Any]:
        """
        Store news summary and generated hooks for an industry.
        
        Args:
            industry: Industry display name (e.g., "Technology")
            industry_slug: Industry slug identifier (e.g., "technology")
            summary: News summary text
            hooks: List of generated LinkedIn hook strings
            
        Returns:
            Dict containing the stored record with id, created_at, etc.
            
        Raises:
            ValueError: If parameters are invalid
            Exception: If database operation fails
        """
        # Validation
        if not industry or not isinstance(industry, str):
            raise ValueError("Industry must be a non-empty string")
        
        if not industry_slug or not isinstance(industry_slug, str):
            raise ValueError("Industry slug must be a non-empty string")
        
        if not summary or not isinstance(summary, str):
            raise ValueError("Summary must be a non-empty string")
        
        if not hooks or not isinstance(hooks, list):
            raise ValueError("Hooks must be a non-empty list")
        
        if not all(isinstance(hook, str) and hook.strip() for hook in hooks):
            raise ValueError("All hooks must be non-empty strings")
        
        try:
            now_iso = datetime.utcnow().isoformat()
            
            # Prepare payload
            payload = {
                'industry': industry,
                'industry_slug': industry_slug,
                'summary': summary,
                'hooks': hooks,
                'created_at': now_iso,
            }
            
            # Insert new record
            result = self.supabase.table('news_hooks').insert(payload).execute()
            
            if not result.data or len(result.data) == 0:
                raise Exception("Database returned no data after insert")
            
            logger.info(f"Successfully stored news hooks for industry: {industry}")
            return result.data[0]
            
        except ValueError as ve:
            logger.error(f"Validation error storing news hooks: {ve}")
            raise
        except Exception as e:
            logger.error(f"Error storing news hooks for {industry}: {e}")
            raise Exception(f"Failed to store news hooks: {str(e)}")
    
    async def get_news_hooks(
        self,
        industry_slug: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Retrieve news hooks, optionally filtered by industry.
        
        Args:
            industry_slug: Optional industry slug to filter by
            limit: Maximum number of records to return (default 50, max 100)
            offset: Number of records to skip for pagination
            
        Returns:
            List of news hook records, ordered by created_at DESC
            
        Raises:
            ValueError: If parameters are invalid
            Exception: If database operation fails
        """
        # Validation
        if limit < 1 or limit > 100:
            raise ValueError("Limit must be between 1 and 100")
        
        if offset < 0:
            raise ValueError("Offset must be non-negative")
        
        try:
            query = (
                self.supabase
                .table('news_hooks')
                .select('*')
                .order('created_at', desc=True)
                .range(offset, offset + limit - 1)
            )
            
            if industry_slug:
                query = query.eq('industry_slug', industry_slug)
            
            result = query.execute()
            
            logger.info(f"Retrieved {len(result.data) if result.data else 0} news hook records")
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Error retrieving news hooks: {e}")
            raise Exception(f"Failed to retrieve news hooks: {str(e)}")