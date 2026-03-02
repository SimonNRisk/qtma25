"""Pydantic models for Slack API endpoints"""

from typing import List, Optional
from pydantic import BaseModel


# ==================== Request Models ====================

class SlackCallbackRequest(BaseModel):
    """Request body for OAuth callback"""
    code: str
    state: Optional[str] = None


class ChannelUpdate(BaseModel):
    """Single channel update in a batch"""
    channel_id: str
    enabled: bool


class UpdateChannelsRequest(BaseModel):
    """Request body for updating channel monitoring status"""
    workspace_id: str
    channels: List[ChannelUpdate]


# ==================== Response Models ====================

class SlackAuthResponse(BaseModel):
    """Response for OAuth URL generation"""
    auth_url: str
    state: str


class SlackWorkspace(BaseModel):
    """Workspace info returned to frontend"""
    id: str
    workspace_id: str
    team_name: str
    created_at: str
    updated_at: Optional[str] = None


class SlackWorkspacesResponse(BaseModel):
    """Response for listing workspaces"""
    workspaces: List[SlackWorkspace]


class SlackChannel(BaseModel):
    """Channel info returned to frontend"""
    id: str
    channel_id: str
    channel_name: str
    channel_type: str
    enabled: bool


class SlackChannelsResponse(BaseModel):
    """Response for listing channels"""
    channels: List[SlackChannel]


class SlackHook(BaseModel):
    """Generated hook from Slack message"""
    id: str
    hooks: List[str]
    category: Optional[str] = None
    source_summary: Optional[str] = None
    channel_name: Optional[str] = None
    created_at: str


class SlackHooksResponse(BaseModel):
    """Response for listing Slack hooks"""
    success: bool
    data: List[SlackHook]
    count: int


class UpdateChannelsResponse(BaseModel):
    """Response for channel updates"""
    success: bool
    updated_count: int


class SlackCallbackSuccessResponse(BaseModel):
    """Response for successful OAuth callback"""
    success: bool
    workspace: SlackWorkspace


class SlackEventResponse(BaseModel):
    """Response for Slack events webhook"""
    ok: bool
    challenge: Optional[str] = None
