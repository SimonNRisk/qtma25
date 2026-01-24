"""
Slack message analysis agent for determining post-worthiness
and generating LinkedIn hooks using OpenAI tool calling.
"""

import json
import os
import logging
from typing import Dict, Any, List, Optional

from openai import OpenAI

logger = logging.getLogger(__name__)

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY")) if os.getenv("OPENAI_API_KEY") else None

# Categories for post-worthy content
CONTENT_CATEGORIES = [
    "hiring",
    "product_launch",
    "milestone",
    "culture",
    "customer_success",
    "thought_leadership",
    "behind_the_scenes"
]

# Tool definition for structured output
SLACK_ANALYSIS_TOOL = {
    "type": "function",
    "function": {
        "name": "analyze_slack_message",
        "description": "Analyze a Slack message for LinkedIn content potential and generate hooks if post-worthy",
        "parameters": {
            "type": "object",
            "properties": {
                "is_post_worthy": {
                    "type": "boolean",
                    "description": "Whether this message contains content worth posting to LinkedIn"
                },
                "category": {
                    "type": "string",
                    "enum": CONTENT_CATEGORIES,
                    "description": "Category of the post-worthy content"
                },
                "reasoning": {
                    "type": "string",
                    "description": "Brief explanation of why this is or isn't post-worthy"
                },
                "hooks": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "description": "A LinkedIn post hook (1-2 sentences, attention-grabbing opening)"
                    },
                    "minItems": 0,
                    "maxItems": 3,
                    "description": "LinkedIn post hooks if the message is post-worthy (2-3 hooks)"
                },
                "source_summary": {
                    "type": "string",
                    "description": "A brief, privacy-safe summary of what this content is about (no specific names or sensitive details)"
                }
            },
            "required": ["is_post_worthy", "reasoning"]
        }
    }
}


def _build_system_prompt(content_goals: Optional[List[str]] = None) -> str:
    """Build the system prompt for the Slack analysis agent"""

    goals_text = ""
    if content_goals and len(content_goals) > 0:
        goals_text = f"\n\nThe founder's content goals are: {', '.join(content_goals)}"

    return f"""You are an expert at identifying company communications that could be transformed into engaging LinkedIn content.

Your task is to:
1. Analyze Slack messages to determine if they contain post-worthy content
2. If post-worthy, generate 2-3 LinkedIn hook options

A message is POST-WORTHY if it relates to:
- Hiring announcements (new hires, team growth, open positions)
- Product launches or updates
- Company milestones (funding, revenue, user growth, partnerships)
- Culture moments (team events, work philosophy, values in action)
- Customer success stories (testimonials, case studies, wins)
- Industry insights or thought leadership from internal discussions
- Behind-the-scenes moments that humanize the company

A message is NOT post-worthy if it's:
- Routine operational messages (meeting reminders, status updates, simple questions)
- Internal technical discussions without broader relevance
- Personal conversations or off-topic chat
- Sensitive/confidential information
- Complaints or negative content
- Very short messages without substance (less than 20 words typically)
- Bot messages or automated notifications{goals_text}

When generating hooks:
- Make them attention-grabbing and curiosity-inducing
- Focus on the broader insight or story, not specific internal details
- Use patterns like "Here's what I learned...", "We just...", "The moment that changed..."
- Keep them professional but engaging
- Avoid mentioning specific internal metrics or sensitive details
- Make them diverse in style (questions, statements, insights)"""


def _build_user_prompt(
    message_text: str,
    channel_name: str,
    workspace_name: Optional[str] = None
) -> str:
    """Build the user prompt for message analysis"""

    context = f"Channel: #{channel_name}"
    if workspace_name:
        context += f" | Workspace: {workspace_name}"

    return f"""Analyze this Slack message for LinkedIn content potential:

{context}

Message:
{message_text}

If this contains post-worthy content, generate 2-3 LinkedIn hook options. Focus on the broader insight or story that could resonate with a professional audience."""


async def analyze_slack_message(
    message_text: str,
    channel_name: str,
    workspace_name: Optional[str] = None,
    content_goals: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Analyze a Slack message for LinkedIn post potential using OpenAI.

    Args:
        message_text: The Slack message content
        channel_name: Name of the Slack channel
        workspace_name: Optional workspace/team name
        content_goals: Optional list of user's content goals from onboarding

    Returns:
        Dict containing:
        - is_post_worthy: bool
        - category: str (if post-worthy)
        - hooks: List[str] (if post-worthy)
        - source_summary: str (if post-worthy)
        - reasoning: str
    """
    if not openai_client:
        logger.error("OpenAI API key not configured")
        return {
            "is_post_worthy": False,
            "reasoning": "OpenAI API not configured"
        }

    # Skip very short messages
    if len(message_text.strip()) < 20:
        return {
            "is_post_worthy": False,
            "reasoning": "Message too short to be post-worthy"
        }

    try:
        system_prompt = _build_system_prompt(content_goals)
        user_prompt = _build_user_prompt(message_text, channel_name, workspace_name)

        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            tools=[SLACK_ANALYSIS_TOOL],
            tool_choice={"type": "function", "function": {"name": "analyze_slack_message"}},
            temperature=0.7,
            max_tokens=800,
        )

        if not response.choices:
            logger.error("OpenAI returned no choices")
            return {
                "is_post_worthy": False,
                "reasoning": "Failed to analyze message"
            }

        message = response.choices[0].message

        if not message.tool_calls or len(message.tool_calls) == 0:
            logger.error("OpenAI did not return tool call")
            return {
                "is_post_worthy": False,
                "reasoning": "Failed to analyze message"
            }

        tool_call = message.tool_calls[0]

        if tool_call.function.name != "analyze_slack_message":
            logger.error(f"Unexpected tool call: {tool_call.function.name}")
            return {
                "is_post_worthy": False,
                "reasoning": "Failed to analyze message"
            }

        # Parse the function arguments
        try:
            result = json.loads(tool_call.function.arguments)
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing tool call arguments: {e}")
            return {
                "is_post_worthy": False,
                "reasoning": "Failed to parse analysis result"
            }

        # Validate and clean hooks if present
        if result.get("is_post_worthy") and result.get("hooks"):
            cleaned_hooks = [
                hook.strip()
                for hook in result["hooks"]
                if hook and hook.strip()
            ]
            result["hooks"] = cleaned_hooks[:3]  # Max 3 hooks

        logger.info(
            f"Analyzed message: post_worthy={result.get('is_post_worthy')}, "
            f"category={result.get('category')}"
        )

        return result

    except Exception as e:
        logger.error(f"Error analyzing Slack message: {e}", exc_info=True)
        return {
            "is_post_worthy": False,
            "reasoning": f"Error during analysis: {str(e)}"
        }
