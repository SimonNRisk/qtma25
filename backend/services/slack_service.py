import os
from supabase import create_client, Client
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

# Configure logging
logger = logging.getLogger(__name__)


class SlackService:
    """Supabase operations for Slack integration data"""

    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)

    # ==================== Workspace CRUD ====================

    async def store_workspace(
        self,
        user_id: str,
        workspace_id: str,
        team_name: str,
        bot_token: str,
        bot_user_id: Optional[str] = None,
        scope: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Store or update a Slack workspace connection.

        Args:
            user_id: UUID of the user
            workspace_id: Slack team_id
            team_name: Slack team name
            bot_token: Bot OAuth token
            bot_user_id: Bot's user ID in the workspace
            scope: Granted OAuth scopes

        Returns:
            The stored workspace record, or None on failure
        """
        try:
            now_iso = datetime.utcnow().isoformat()

            # Check if workspace connection already exists for this user
            existing = (
                self.supabase
                .table('slack_workspaces')
                .select('*')
                .eq('user_id', user_id)
                .eq('workspace_id', workspace_id)
                .execute()
            )

            workspace_data = {
                'user_id': user_id,
                'workspace_id': workspace_id,
                'team_name': team_name,
                'bot_token': bot_token,
                'bot_user_id': bot_user_id,
                'scope': scope,
                'updated_at': now_iso,
            }

            if existing.data and len(existing.data) > 0:
                # Update existing workspace
                result = (
                    self.supabase
                    .table('slack_workspaces')
                    .update(workspace_data)
                    .eq('user_id', user_id)
                    .eq('workspace_id', workspace_id)
                    .execute()
                )
                logger.info(f"Updated Slack workspace {workspace_id} for user {user_id}")
            else:
                # Insert new workspace
                workspace_data['created_at'] = now_iso
                result = (
                    self.supabase
                    .table('slack_workspaces')
                    .insert(workspace_data)
                    .execute()
                )
                logger.info(f"Inserted new Slack workspace {workspace_id} for user {user_id}")

            if result.data and len(result.data) > 0:
                return result.data[0]

            return None

        except Exception as e:
            logger.error(f"Error storing Slack workspace: {e}", exc_info=True)
            return None

    async def get_user_workspaces(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all Slack workspaces connected by a user"""
        try:
            result = (
                self.supabase
                .table('slack_workspaces')
                .select('id, workspace_id, team_name, created_at, updated_at')
                .eq('user_id', user_id)
                .order('created_at', desc=True)
                .execute()
            )

            return result.data if result.data else []

        except Exception as e:
            logger.error(f"Error getting user workspaces: {e}", exc_info=True)
            return []

    async def get_workspace_by_id(self, workspace_uuid: str) -> Optional[Dict[str, Any]]:
        """Get a workspace by its UUID (includes bot_token)"""
        try:
            result = (
                self.supabase
                .table('slack_workspaces')
                .select('*')
                .eq('id', workspace_uuid)
                .execute()
            )

            if result.data and len(result.data) > 0:
                return result.data[0]

            return None

        except Exception as e:
            logger.error(f"Error getting workspace by ID: {e}", exc_info=True)
            return None

    async def get_workspace_by_slack_id(self, slack_workspace_id: str) -> Optional[Dict[str, Any]]:
        """Get a workspace by its Slack team_id (includes bot_token)"""
        try:
            result = (
                self.supabase
                .table('slack_workspaces')
                .select('*')
                .eq('workspace_id', slack_workspace_id)
                .execute()
            )

            if result.data and len(result.data) > 0:
                return result.data[0]

            return None

        except Exception as e:
            logger.error(f"Error getting workspace by Slack ID: {e}", exc_info=True)
            return None

    async def delete_workspace(self, workspace_uuid: str, user_id: str) -> bool:
        """Delete a workspace connection (cascades to channels and hooks)"""
        try:
            result = (
                self.supabase
                .table('slack_workspaces')
                .delete()
                .eq('id', workspace_uuid)
                .eq('user_id', user_id)
                .execute()
            )

            success = result.data is not None and len(result.data) > 0
            if success:
                logger.info(f"Deleted Slack workspace {workspace_uuid} for user {user_id}")
            return success

        except Exception as e:
            logger.error(f"Error deleting workspace: {e}", exc_info=True)
            return False

    # ==================== Channel CRUD ====================

    async def upsert_channels(
        self,
        workspace_uuid: str,
        channels: List[Dict[str, Any]]
    ) -> bool:
        """
        Upsert channels for a workspace.

        Args:
            workspace_uuid: UUID of the slack_workspaces record
            channels: List of channel dicts with channel_id, channel_name, channel_type

        Returns:
            True if successful
        """
        try:
            now_iso = datetime.utcnow().isoformat()

            for channel in channels:
                channel_data = {
                    'workspace_id': workspace_uuid,
                    'channel_id': channel['channel_id'],
                    'channel_name': channel['channel_name'],
                    'channel_type': channel.get('channel_type', 'public'),
                    'enabled': channel.get('enabled', False),
                    'updated_at': now_iso,
                }

                # Check if channel exists
                existing = (
                    self.supabase
                    .table('slack_channels')
                    .select('id')
                    .eq('workspace_id', workspace_uuid)
                    .eq('channel_id', channel['channel_id'])
                    .execute()
                )

                if existing.data and len(existing.data) > 0:
                    # Update existing channel
                    self.supabase.table('slack_channels').update(channel_data).eq(
                        'workspace_id', workspace_uuid
                    ).eq('channel_id', channel['channel_id']).execute()
                else:
                    # Insert new channel
                    channel_data['created_at'] = now_iso
                    self.supabase.table('slack_channels').insert(channel_data).execute()

            logger.info(f"Upserted {len(channels)} channels for workspace {workspace_uuid}")
            return True

        except Exception as e:
            logger.error(f"Error upserting channels: {e}", exc_info=True)
            return False

    async def get_channels(self, workspace_uuid: str) -> List[Dict[str, Any]]:
        """Get all channels for a workspace"""
        try:
            result = (
                self.supabase
                .table('slack_channels')
                .select('*')
                .eq('workspace_id', workspace_uuid)
                .order('channel_name')
                .execute()
            )

            return result.data if result.data else []

        except Exception as e:
            logger.error(f"Error getting channels: {e}", exc_info=True)
            return []

    async def get_enabled_channels(self, workspace_uuid: str) -> List[Dict[str, Any]]:
        """Get only enabled (monitored) channels for a workspace"""
        try:
            result = (
                self.supabase
                .table('slack_channels')
                .select('*')
                .eq('workspace_id', workspace_uuid)
                .eq('enabled', True)
                .execute()
            )

            return result.data if result.data else []

        except Exception as e:
            logger.error(f"Error getting enabled channels: {e}", exc_info=True)
            return []

    async def update_channel_enabled(
        self,
        workspace_uuid: str,
        channel_id: str,
        enabled: bool
    ) -> bool:
        """Enable or disable monitoring for a channel"""
        try:
            result = (
                self.supabase
                .table('slack_channels')
                .update({
                    'enabled': enabled,
                    'updated_at': datetime.utcnow().isoformat()
                })
                .eq('workspace_id', workspace_uuid)
                .eq('channel_id', channel_id)
                .execute()
            )

            success = result.data is not None and len(result.data) > 0
            if success:
                logger.info(f"Updated channel {channel_id} enabled={enabled}")
            return success

        except Exception as e:
            logger.error(f"Error updating channel enabled status: {e}", exc_info=True)
            return False

    async def is_channel_enabled(self, workspace_uuid: str, channel_id: str) -> bool:
        """Check if a channel is enabled for monitoring"""
        try:
            result = (
                self.supabase
                .table('slack_channels')
                .select('enabled')
                .eq('workspace_id', workspace_uuid)
                .eq('channel_id', channel_id)
                .execute()
            )

            if result.data and len(result.data) > 0:
                return result.data[0].get('enabled', False)

            return False

        except Exception as e:
            logger.error(f"Error checking channel enabled status: {e}", exc_info=True)
            return False

    # ==================== Hooks CRUD ====================

    async def store_hooks(
        self,
        user_id: str,
        workspace_uuid: str,
        channel_id: str,
        hooks: List[str],
        category: Optional[str] = None,
        source_summary: Optional[str] = None,
        message_ts: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Store generated hooks from a Slack message.

        Args:
            user_id: UUID of the user
            workspace_uuid: UUID of the slack_workspaces record
            channel_id: Slack channel ID
            hooks: List of generated hook strings
            category: Content category (hiring, product_launch, etc.)
            source_summary: Brief summary of the source message
            message_ts: Slack message timestamp for deduplication

        Returns:
            The stored hook record, or None on failure
        """
        try:
            if not hooks or not isinstance(hooks, list):
                raise ValueError("Hooks must be a non-empty list")

            now_iso = datetime.utcnow().isoformat()

            hook_data = {
                'user_id': user_id,
                'workspace_id': workspace_uuid,
                'channel_id': channel_id,
                'hooks': hooks,
                'category': category,
                'source_summary': source_summary,
                'message_ts': message_ts,
                'created_at': now_iso,
            }

            result = self.supabase.table('slack_hooks').insert(hook_data).execute()

            if result.data and len(result.data) > 0:
                logger.info(f"Stored {len(hooks)} hooks for user {user_id}")
                return result.data[0]

            return None

        except Exception as e:
            logger.error(f"Error storing hooks: {e}", exc_info=True)
            return None

    async def get_user_hooks(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get Slack-generated hooks for a user with pagination.

        Args:
            user_id: UUID of the user
            limit: Maximum records to return (default 20, max 50)
            offset: Number of records to skip
            category: Optional category filter

        Returns:
            List of hook records ordered by created_at DESC
        """
        try:
            if limit < 1 or limit > 50:
                limit = 20

            if offset < 0:
                offset = 0

            query = (
                self.supabase
                .table('slack_hooks')
                .select('*, slack_channels!inner(channel_name)')
                .eq('user_id', user_id)
                .order('created_at', desc=True)
                .range(offset, offset + limit - 1)
            )

            if category:
                query = query.eq('category', category)

            result = query.execute()

            return result.data if result.data else []

        except Exception as e:
            logger.error(f"Error getting user hooks: {e}", exc_info=True)
            return []

    async def hook_exists_for_message(
        self,
        workspace_uuid: str,
        message_ts: str
    ) -> bool:
        """Check if hooks already exist for a specific message (deduplication)"""
        try:
            result = (
                self.supabase
                .table('slack_hooks')
                .select('id')
                .eq('workspace_id', workspace_uuid)
                .eq('message_ts', message_ts)
                .execute()
            )

            return result.data is not None and len(result.data) > 0

        except Exception as e:
            logger.error(f"Error checking hook existence: {e}", exc_info=True)
            return False

    async def delete_hook(self, hook_id: str, user_id: str) -> bool:
        """Delete a specific hook record"""
        try:
            result = (
                self.supabase
                .table('slack_hooks')
                .delete()
                .eq('id', hook_id)
                .eq('user_id', user_id)
                .execute()
            )

            return result.data is not None and len(result.data) > 0

        except Exception as e:
            logger.error(f"Error deleting hook: {e}", exc_info=True)
            return False
