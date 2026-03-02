import httpx
import os
import secrets
from typing import Dict, Any, List


class SlackOAuth:
    """Handle Slack OAuth 2.0 flow for workspace installation"""

    def __init__(self):
        self.client_id = os.getenv('SLACK_CLIENT_ID')
        self.client_secret = os.getenv('SLACK_CLIENT_SECRET')
        self.redirect_uri = os.getenv('SLACK_REDIRECT_URI', 'http://localhost:3000/slack-connect/callback')
        # Bot scopes for read-only channel access
        self.scopes = 'channels:read,channels:history,groups:read,groups:history,users:read'

    def get_auth_url(self) -> Dict[str, str]:
        """Generate Slack OAuth authorization URL for workspace installation"""
        state = secrets.token_urlsafe(32)

        auth_url = (
            f"https://slack.com/oauth/v2/authorize?"
            f"client_id={self.client_id}&"
            f"scope={self.scopes}&"
            f"redirect_uri={self.redirect_uri}&"
            f"state={state}"
        )

        return {"auth_url": auth_url, "state": state}

    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for bot access token.

        Returns:
            Dict containing:
            - access_token: Bot token for API calls
            - team: {id, name} - Workspace info
            - bot_user_id: Bot's user ID in the workspace
            - scope: Granted scopes
        """
        token_url = "https://slack.com/api/oauth.v2.access"

        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "redirect_uri": self.redirect_uri,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data)

            if response.status_code != 200:
                raise Exception(f"Token exchange failed: HTTP {response.status_code}")

            result = response.json()

            if not result.get("ok"):
                error = result.get("error", "Unknown error")
                raise Exception(f"Slack OAuth error: {error}")

            return {
                "access_token": result.get("access_token"),
                "team": result.get("team", {}),
                "bot_user_id": result.get("bot_user_id"),
                "scope": result.get("scope"),
            }

    async def get_channels(self, bot_token: str, include_private: bool = True) -> List[Dict[str, Any]]:
        """
        Fetch list of channels the bot can access.

        Args:
            bot_token: Slack bot token
            include_private: Whether to include private channels (groups)

        Returns:
            List of channel objects with id, name, is_private
        """
        channels = []

        # Fetch public channels
        public_channels = await self._fetch_channel_list(
            bot_token,
            "https://slack.com/api/conversations.list",
            {"types": "public_channel", "exclude_archived": "true", "limit": 200}
        )
        channels.extend(public_channels)

        # Fetch private channels if requested
        if include_private:
            private_channels = await self._fetch_channel_list(
                bot_token,
                "https://slack.com/api/conversations.list",
                {"types": "private_channel", "exclude_archived": "true", "limit": 200}
            )
            channels.extend(private_channels)

        return channels

    async def _fetch_channel_list(
        self,
        bot_token: str,
        url: str,
        params: Dict[str, str]
    ) -> List[Dict[str, Any]]:
        """Fetch channels with pagination support"""
        channels = []
        cursor = None

        async with httpx.AsyncClient() as client:
            while True:
                request_params = {**params}
                if cursor:
                    request_params["cursor"] = cursor

                response = await client.get(
                    url,
                    headers={"Authorization": f"Bearer {bot_token}"},
                    params=request_params
                )

                if response.status_code != 200:
                    raise Exception(f"Failed to fetch channels: HTTP {response.status_code}")

                result = response.json()

                if not result.get("ok"):
                    error = result.get("error", "Unknown error")
                    # permission errors are expected for private channels
                    if error in ["missing_scope", "not_allowed_token_type"]:
                        break
                    raise Exception(f"Slack API error: {error}")

                for channel in result.get("channels", []):
                    channels.append({
                        "id": channel.get("id"),
                        "name": channel.get("name"),
                        "is_private": channel.get("is_private", False),
                        "is_member": channel.get("is_member", False),
                    })

                # Check for pagination
                cursor = result.get("response_metadata", {}).get("next_cursor")
                if not cursor:
                    break

        return channels

    async def get_channel_info(self, bot_token: str, channel_id: str) -> Dict[str, Any]:
        """Get information about a specific channel"""
        url = "https://slack.com/api/conversations.info"

        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers={"Authorization": f"Bearer {bot_token}"},
                params={"channel": channel_id}
            )

            if response.status_code != 200:
                raise Exception(f"Failed to get channel info: HTTP {response.status_code}")

            result = response.json()

            if not result.get("ok"):
                error = result.get("error", "Unknown error")
                raise Exception(f"Slack API error: {error}")

            channel = result.get("channel", {})
            return {
                "id": channel.get("id"),
                "name": channel.get("name"),
                "is_private": channel.get("is_private", False),
            }
