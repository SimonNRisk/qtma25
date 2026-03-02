"""
Slack integration API endpoints.

Handles OAuth flow, event subscriptions, channel management, and hooks retrieval.
"""

import base64
import json
import logging
import hmac
import hashlib
import time
from typing import Annotated, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status

from auth import get_current_user
from slack_oauth import SlackOAuth
from services.slack_service import SlackService

from .models import (
    SlackAuthResponse,
    SlackCallbackRequest,
    SlackCallbackSuccessResponse,
    SlackChannel,
    SlackChannelsResponse,
    SlackEventResponse,
    SlackHook,
    SlackHooksResponse,
    SlackWorkspace,
    SlackWorkspacesResponse,
    UpdateChannelsRequest,
    UpdateChannelsResponse,
)
from .agent import analyze_slack_message

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/slack", tags=["slack"])

# Initialize services
try:
    slack_service = SlackService()
except Exception as e:
    logger.warning(f"Failed to initialize SlackService: {e}")
    slack_service = None


# ==================== OAuth Endpoints ====================

@router.get("/oauth", response_model=SlackAuthResponse)
def slack_oauth(current_user: Annotated[dict, Depends(get_current_user)]):
    """
    Generate Slack OAuth URL for workspace installation.
    Encodes user_id in state parameter for callback.
    """
    oauth = SlackOAuth()
    auth_data = oauth.get_auth_url()

    # Encode user ID in state parameter (same pattern as LinkedIn)
    user_id = current_user["id"]
    state_data = {
        "state": auth_data["state"],
        "user_id": user_id
    }
    encoded_state = base64.b64encode(json.dumps(state_data).encode()).decode()

    # Replace state in URL with encoded version
    auth_url = auth_data["auth_url"].replace(auth_data["state"], encoded_state)

    return SlackAuthResponse(auth_url=auth_url, state=encoded_state)


@router.post("/oauth/callback", response_model=SlackCallbackSuccessResponse)
async def slack_oauth_callback(request: SlackCallbackRequest):
    """
    Handle Slack OAuth callback.
    Exchanges code for bot token and stores workspace info.
    """
    if not slack_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Slack service not available"
        )

    try:
        oauth = SlackOAuth()

        # Extract user ID from state parameter
        user_id = None
        if request.state:
            try:
                decoded_state = base64.b64decode(request.state.encode()).decode()
                state_data = json.loads(decoded_state)
                user_id = state_data.get("user_id")
            except Exception as e:
                logger.error(f"Error decoding state parameter: {e}")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid state parameter - user ID not found"
            )

        # Exchange code for token
        token_data = await oauth.exchange_code_for_token(request.code)

        access_token = token_data.get("access_token")
        team = token_data.get("team", {})
        workspace_id = team.get("id")
        team_name = team.get("name", "Unknown Workspace")
        bot_user_id = token_data.get("bot_user_id")
        scope = token_data.get("scope")

        if not access_token or not workspace_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to obtain access token from Slack"
            )

        # Store workspace in database
        workspace = await slack_service.store_workspace(
            user_id=user_id,
            workspace_id=workspace_id,
            team_name=team_name,
            bot_token=access_token,
            bot_user_id=bot_user_id,
            scope=scope
        )

        if not workspace:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to store workspace connection"
            )

        # Fetch and store available channels
        try:
            channels = await oauth.get_channels(access_token)
            channel_data = [
                {
                    "channel_id": ch["id"],
                    "channel_name": ch["name"],
                    "channel_type": "private" if ch.get("is_private") else "public",
                    "enabled": False
                }
                for ch in channels
            ]
            await slack_service.upsert_channels(workspace["id"], channel_data)
        except Exception as e:
            logger.warning(f"Failed to fetch initial channels: {e}")

        return SlackCallbackSuccessResponse(
            success=True,
            workspace=SlackWorkspace(
                id=workspace["id"],
                workspace_id=workspace["workspace_id"],
                team_name=workspace["team_name"],
                created_at=workspace["created_at"],
                updated_at=workspace.get("updated_at")
            )
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OAuth callback error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth error: {str(e)}"
        )


# ==================== Events Webhook ====================

@router.post("/events", response_model=SlackEventResponse)
async def slack_events(request: Request, background_tasks: BackgroundTasks):
    """
    Receive Slack events webhook.
    Must respond within 3 seconds - processing happens in background.
    """
    body = await request.json()

    # Handle URL verification challenge
    if body.get("type") == "url_verification":
        return SlackEventResponse(ok=True, challenge=body.get("challenge"))

    # Handle event callbacks
    if body.get("type") == "event_callback":
        event = body.get("event", {})
        team_id = body.get("team_id")

        # Only process message events
        if event.get("type") == "message" and not event.get("subtype"):
            # Add to background task queue
            background_tasks.add_task(
                process_slack_message,
                team_id=team_id,
                channel_id=event.get("channel"),
                user_id=event.get("user"),
                text=event.get("text", ""),
                message_ts=event.get("ts")
            )

        return SlackEventResponse(ok=True)

    return SlackEventResponse(ok=True)


async def process_slack_message(
    team_id: str,
    channel_id: str,
    user_id: str,
    text: str,
    message_ts: str
):
    """
    Background task to process a Slack message for hook generation.
    """
    if not slack_service:
        logger.error("Slack service not available for message processing")
        return

    try:
        # Get workspace by Slack team ID
        workspace = await slack_service.get_workspace_by_slack_id(team_id)
        if not workspace:
            logger.debug(f"No workspace found for team {team_id}")
            return

        workspace_uuid = workspace["id"]
        astro_user_id = workspace["user_id"]

        # Check if this channel is enabled for monitoring
        is_enabled = await slack_service.is_channel_enabled(workspace_uuid, channel_id)
        if not is_enabled:
            logger.debug(f"Channel {channel_id} not enabled for monitoring")
            return

        # Check for duplicate message
        already_processed = await slack_service.hook_exists_for_message(
            workspace_uuid, message_ts
        )
        if already_processed:
            logger.debug(f"Message {message_ts} already processed")
            return

        # Get channel info for context
        channels = await slack_service.get_channels(workspace_uuid)
        channel_info = next(
            (ch for ch in channels if ch["channel_id"] == channel_id),
            None
        )
        channel_name = channel_info["channel_name"] if channel_info else "unknown"

        # Analyze message for post-worthiness
        # TODO: Get user's content goals from onboarding_context
        analysis = await analyze_slack_message(
            message_text=text,
            channel_name=channel_name,
            workspace_name=workspace.get("team_name"),
            content_goals=None
        )

        if not analysis.get("is_post_worthy"):
            logger.debug(f"Message not post-worthy: {analysis.get('reasoning')}")
            return

        hooks = analysis.get("hooks", [])
        if not hooks:
            logger.debug("No hooks generated")
            return

        # Store the generated hooks
        await slack_service.store_hooks(
            user_id=astro_user_id,
            workspace_uuid=workspace_uuid,
            channel_id=channel_id,
            hooks=hooks,
            category=analysis.get("category"),
            source_summary=analysis.get("source_summary"),
            message_ts=message_ts
        )

        logger.info(
            f"Generated {len(hooks)} hooks for message in #{channel_name} "
            f"(category: {analysis.get('category')})"
        )

    except Exception as e:
        logger.error(f"Error processing Slack message: {e}", exc_info=True)


# ==================== Workspace Management ====================

@router.get("/workspaces", response_model=SlackWorkspacesResponse)
async def get_workspaces(current_user: Annotated[dict, Depends(get_current_user)]):
    """Get all Slack workspaces connected by the current user"""
    if not slack_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Slack service not available"
        )

    user_id = current_user["id"]
    workspaces = await slack_service.get_user_workspaces(user_id)

    return SlackWorkspacesResponse(
        workspaces=[
            SlackWorkspace(
                id=w["id"],
                workspace_id=w["workspace_id"],
                team_name=w["team_name"],
                created_at=w["created_at"],
                updated_at=w.get("updated_at")
            )
            for w in workspaces
        ]
    )


@router.delete("/workspaces/{workspace_id}")
async def delete_workspace(
    workspace_id: str,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Disconnect a Slack workspace"""
    if not slack_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Slack service not available"
        )

    user_id = current_user["id"]
    success = await slack_service.delete_workspace(workspace_id, user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    return {"success": True, "message": "Workspace disconnected"}


# ==================== Channel Management ====================

@router.get("/channels", response_model=SlackChannelsResponse)
async def get_channels(
    workspace_id: str = Query(..., description="UUID of the workspace"),
    current_user: Annotated[dict, Depends(get_current_user)] = None
):
    """Get all channels for a workspace"""
    if not slack_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Slack service not available"
        )

    # Verify user owns this workspace
    workspace = await slack_service.get_workspace_by_id(workspace_id)
    if not workspace or workspace["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    channels = await slack_service.get_channels(workspace_id)

    return SlackChannelsResponse(
        channels=[
            SlackChannel(
                id=ch["id"],
                channel_id=ch["channel_id"],
                channel_name=ch["channel_name"],
                channel_type=ch["channel_type"],
                enabled=ch["enabled"]
            )
            for ch in channels
        ]
    )


@router.post("/channels/refresh")
async def refresh_channels(
    workspace_id: str = Query(..., description="UUID of the workspace"),
    current_user: Annotated[dict, Depends(get_current_user)] = None
):
    """Refresh channel list from Slack API"""
    if not slack_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Slack service not available"
        )

    # Verify user owns this workspace
    workspace = await slack_service.get_workspace_by_id(workspace_id)
    if not workspace or workspace["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    # Fetch channels from Slack
    oauth = SlackOAuth()
    try:
        slack_channels = await oauth.get_channels(workspace["bot_token"])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch channels from Slack: {str(e)}"
        )

    # Get existing channel settings
    existing_channels = await slack_service.get_channels(workspace_id)
    enabled_channel_ids = {
        ch["channel_id"] for ch in existing_channels if ch["enabled"]
    }

    # Upsert channels, preserving enabled status
    channel_data = [
        {
            "channel_id": ch["id"],
            "channel_name": ch["name"],
            "channel_type": "private" if ch.get("is_private") else "public",
            "enabled": ch["id"] in enabled_channel_ids
        }
        for ch in slack_channels
    ]

    await slack_service.upsert_channels(workspace_id, channel_data)

    return {"success": True, "channel_count": len(channel_data)}


@router.post("/channels", response_model=UpdateChannelsResponse)
async def update_channels(
    request: UpdateChannelsRequest,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Enable or disable monitoring for channels"""
    if not slack_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Slack service not available"
        )

    # Verify user owns this workspace
    workspace = await slack_service.get_workspace_by_id(request.workspace_id)
    if not workspace or workspace["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    updated_count = 0
    for channel in request.channels:
        success = await slack_service.update_channel_enabled(
            workspace_uuid=request.workspace_id,
            channel_id=channel.channel_id,
            enabled=channel.enabled
        )
        if success:
            updated_count += 1

    return UpdateChannelsResponse(success=True, updated_count=updated_count)


# ==================== Hooks Retrieval ====================

@router.get("/hooks", response_model=SlackHooksResponse)
async def get_slack_hooks(
    current_user: Annotated[dict, Depends(get_current_user)],
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    category: Optional[str] = Query(default=None)
):
    """Get Slack-generated hooks for the current user"""
    if not slack_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Slack service not available"
        )

    user_id = current_user["id"]
    hooks = await slack_service.get_user_hooks(
        user_id=user_id,
        limit=limit,
        offset=offset,
        category=category
    )

    return SlackHooksResponse(
        success=True,
        data=[
            SlackHook(
                id=h["id"],
                hooks=h["hooks"],
                category=h.get("category"),
                source_summary=h.get("source_summary"),
                channel_name=h.get("slack_channels", {}).get("channel_name"),
                created_at=h["created_at"]
            )
            for h in hooks
        ],
        count=len(hooks)
    )


@router.delete("/hooks/{hook_id}")
async def delete_hook(
    hook_id: str,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Delete a specific Slack hook"""
    if not slack_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Slack service not available"
        )

    user_id = current_user["id"]
    success = await slack_service.delete_hook(hook_id, user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hook not found"
        )

    return {"success": True, "message": "Hook deleted"}
