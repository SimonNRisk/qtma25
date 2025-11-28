"""
Thought Prompts Service

Handles all database operations for thought prompts and responses.
Uses Supabase as the backend database.
"""

import os
import random
from supabase import create_client, Client
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

# Configure logging
logger = logging.getLogger(__name__)


class ThoughtPromptsService:
    """
    Service class for managing thought prompts and user responses.
    
    Provides methods for:
    - Fetching active thought prompts
    - Submitting and updating user responses
    - Retrieving user response history
    """
    
    def __init__(self):
        """Initialize the Supabase client."""
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables"
            )
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
    
    # =========================================================================
    # Thought Prompts Methods
    # =========================================================================
    
    async def get_current_prompt(self) -> Optional[Dict[str, Any]]:
        """
        Get the most recently created active thought prompt.
        
        Returns:
            Dict with prompt data (id, question, created_at) or None if no prompts exist
        """
        try:
            result = (
                self.supabase
                .table('thought_prompts')
                .select('id, question, created_at')
                .eq('is_active', True)
                .order('created_at', desc=True)
                .limit(1)
                .execute()
            )
            
            if result.data and len(result.data) > 0:
                logger.info(f"Retrieved current thought prompt: {result.data[0]['id']}")
                return result.data[0]
            
            logger.warning("No active thought prompts found")
            return None
            
        except Exception as e:
            logger.error(f"Error getting current thought prompt: {e}")
            raise Exception(f"Failed to get current thought prompt: {str(e)}")
    
    async def get_random_prompt(self) -> Optional[Dict[str, Any]]:
        """
        Get a random active thought prompt.
        
        Returns:
            Dict with prompt data (id, question, created_at) or None if no prompts exist
        """
        try:
            # First, get all active prompts
            result = (
                self.supabase
                .table('thought_prompts')
                .select('id, question, created_at')
                .eq('is_active', True)
                .execute()
            )
            
            if result.data and len(result.data) > 0:
                # Select a random prompt
                prompt = random.choice(result.data)
                logger.info(f"Retrieved random thought prompt: {prompt['id']}")
                return prompt
            
            logger.warning("No active thought prompts found")
            return None
            
        except Exception as e:
            logger.error(f"Error getting random thought prompt: {e}")
            raise Exception(f"Failed to get random thought prompt: {str(e)}")
    
    async def get_prompt_by_id(self, prompt_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific thought prompt by ID.
        
        Args:
            prompt_id: UUID of the thought prompt
            
        Returns:
            Dict with prompt data or None if not found
        """
        try:
            result = (
                self.supabase
                .table('thought_prompts')
                .select('id, question, is_active, created_at')
                .eq('id', prompt_id)
                .execute()
            )
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting thought prompt by ID: {e}")
            raise Exception(f"Failed to get thought prompt: {str(e)}")
    
    async def get_all_active_prompts(self) -> List[Dict[str, Any]]:
        """
        Get all active thought prompts.
        
        Returns:
            List of prompt dicts
        """
        try:
            result = (
                self.supabase
                .table('thought_prompts')
                .select('id, question, created_at')
                .eq('is_active', True)
                .order('created_at', desc=True)
                .execute()
            )
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Error getting all active prompts: {e}")
            raise Exception(f"Failed to get active prompts: {str(e)}")
    
    # =========================================================================
    # Response Methods
    # =========================================================================
    
    async def submit_response(
        self,
        user_id: str,
        thought_prompt_id: str,
        response: str
    ) -> Dict[str, Any]:
        """
        Submit or update a user's response to a thought prompt.
        
        Uses upsert to handle both new responses and updates.
        
        Args:
            user_id: UUID of the user
            thought_prompt_id: UUID of the thought prompt
            response: The user's response text
            
        Returns:
            Dict containing the stored/updated response record
            
        Raises:
            ValueError: If parameters are invalid
            Exception: If database operation fails
        """
        # Validation
        if not user_id:
            raise ValueError("User ID is required")
        
        if not thought_prompt_id:
            raise ValueError("Thought prompt ID is required")
        
        if not response or not response.strip():
            raise ValueError("Response cannot be empty")
        
        try:
            now_iso = datetime.utcnow().isoformat()
            
            # Check if user already has a response for this prompt
            existing = (
                self.supabase
                .table('thought_prompt_responses')
                .select('id')
                .eq('user_id', user_id)
                .eq('thought_prompt_id', thought_prompt_id)
                .execute()
            )
            
            if existing.data and len(existing.data) > 0:
                # Update existing response
                result = (
                    self.supabase
                    .table('thought_prompt_responses')
                    .update({
                        'response': response.strip(),
                        'updated_at': now_iso
                    })
                    .eq('id', existing.data[0]['id'])
                    .execute()
                )
                logger.info(f"Updated response for user {user_id} on prompt {thought_prompt_id}")
            else:
                # Insert new response
                result = (
                    self.supabase
                    .table('thought_prompt_responses')
                    .insert({
                        'user_id': user_id,
                        'thought_prompt_id': thought_prompt_id,
                        'response': response.strip(),
                        'created_at': now_iso,
                        'updated_at': now_iso
                    })
                    .execute()
                )
                logger.info(f"Created new response for user {user_id} on prompt {thought_prompt_id}")
            
            if not result.data or len(result.data) == 0:
                raise Exception("Database returned no data after operation")
            
            return result.data[0]
            
        except ValueError as ve:
            logger.error(f"Validation error submitting response: {ve}")
            raise
        except Exception as e:
            logger.error(f"Error submitting response: {e}")
            raise Exception(f"Failed to submit response: {str(e)}")
    
    async def get_user_response_for_prompt(
        self,
        user_id: str,
        thought_prompt_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get a user's response for a specific thought prompt.
        
        Args:
            user_id: UUID of the user
            thought_prompt_id: UUID of the thought prompt
            
        Returns:
            Dict with response data or None if no response exists
        """
        try:
            result = (
                self.supabase
                .table('thought_prompt_responses')
                .select('*')
                .eq('user_id', user_id)
                .eq('thought_prompt_id', thought_prompt_id)
                .execute()
            )
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting user response for prompt: {e}")
            raise Exception(f"Failed to get response: {str(e)}")
    
    async def get_user_responses(
        self,
        user_id: str,
        limit: int = 10,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get all responses by a user with pagination.
        
        Includes the associated prompt question for each response.
        
        Args:
            user_id: UUID of the user
            limit: Maximum number of records to return
            offset: Number of records to skip
            
        Returns:
            List of response dicts with prompt questions
        """
        try:
            # Get responses with prompt data via join
            result = (
                self.supabase
                .table('thought_prompt_responses')
                .select('*, thought_prompts(question)')
                .eq('user_id', user_id)
                .order('created_at', desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )
            
            # Flatten the nested prompt data
            responses = []
            for item in (result.data or []):
                response = {
                    'id': item['id'],
                    'thought_prompt_id': item['thought_prompt_id'],
                    'user_id': item['user_id'],
                    'response': item['response'],
                    'created_at': item['created_at'],
                    'updated_at': item['updated_at'],
                    'question': item.get('thought_prompts', {}).get('question') if item.get('thought_prompts') else None
                }
                responses.append(response)
            
            logger.info(f"Retrieved {len(responses)} responses for user {user_id}")
            return responses
            
        except Exception as e:
            logger.error(f"Error getting user responses: {e}")
            raise Exception(f"Failed to get responses: {str(e)}")
    
    async def get_user_responses_count(self, user_id: str) -> int:
        """
        Get the total number of responses by a user.
        
        Args:
            user_id: UUID of the user
            
        Returns:
            Integer count of responses
        """
        try:
            result = (
                self.supabase
                .table('thought_prompt_responses')
                .select('id', count='exact')
                .eq('user_id', user_id)
                .execute()
            )
            
            count = result.count if hasattr(result, 'count') and result.count is not None else 0
            return count
            
        except Exception as e:
            logger.error(f"Error counting user responses: {e}")
            raise Exception(f"Failed to count responses: {str(e)}")

