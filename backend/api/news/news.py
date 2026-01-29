import asyncio
import json
import os
import re
from typing import Annotated, Any, Awaitable, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Header, Query, Request, status
import anthropic
from pydantic import BaseModel

from utils.rate_limit import news_rate_limiter, get_client_ip
from utils.simple_auth import verify_api_token
from linkedin_supabase_service import SupabaseService
from auth import get_current_user

from .models import (
    Article,
    BulkIndustryNewsResponse,
    IndustryAPIConfig,
    IndustryInfo,
    IndustryNewsResponse,
    MissingAPIKey,
)
from .parsers import (
    _parse_alphavantage,
    _parse_gdelt,
    _parse_gnews,
    _parse_guardian,
    _parse_newsapi,
    _parse_newsdata,
)
from .service import IndustryNewsService
from .summary_builder import NewsSummaryBuilder

router = APIRouter(prefix="/api/news", tags=["news"])


INDUSTRY_CONFIGS: List[IndustryAPIConfig] = [
    IndustryAPIConfig(
        slug="technology",
        industry="Technology",
        provider="GNews",
        endpoint="https://gnews.io/api/v4/top-headlines",
        api_key_env="GNEWS_API_KEY",
        params_builder=lambda api_key: {
            "topic": "technology",
            "lang": "en",
            "max": 10,
            "apikey": api_key,
        },
        parser=_parse_gnews,
    ),
    IndustryAPIConfig(
        slug="finance",
        industry="Finance",
        provider="Alpha Vantage",
        endpoint="https://www.alphavantage.co/query",
        api_key_env="ALPHAVANTAGE_API_KEY",
        params_builder=lambda api_key: {
            "function": "NEWS_SENTIMENT",
            "topics": "financial_markets",
            "sort": "LATEST",
            "limit": 10,
            "apikey": api_key,
        },
        parser=_parse_alphavantage,
    ),
    IndustryAPIConfig(
        slug="healthcare",
        industry="Healthcare",
        provider="NewsData.io",
        endpoint="https://newsdata.io/api/1/news",
        api_key_env="NEWSDATA_API_KEY",
        params_builder=lambda api_key: {
            "category": "health",
            "language": "en",
            "apikey": api_key,
        },
        parser=_parse_newsdata,
    ),
    IndustryAPIConfig(
        slug="energy",
        industry="Energy",
        provider="GDELT Project",
        endpoint="https://api.gdeltproject.org/api/v2/doc/doc",
        requires_api_key=False,
        params_builder=lambda _api_key: {
            "query": "energy OR renewable energy OR oil market",
            "mode": "ArtList",
            "maxrecords": 10,
            "format": "json",
            "sort": "DateDesc",
        },
        parser=_parse_gdelt,
    ),
    IndustryAPIConfig(
        slug="retail",
        industry="Retail",
        provider="The Guardian Open Platform",
        endpoint="https://content.guardianapis.com/search",
        api_key_env="GUARDIAN_API_KEY",
        params_builder=lambda api_key: {
            "section": "business",
            "tag": "business/retail",
            "order-by": "newest",
            "page-size": 10,
            "show-fields": "trailText,headline",
            "api-key": api_key,
        },
        parser=_parse_guardian,
    ),
    IndustryAPIConfig(
        slug="transportation",
        industry="Transportation",
        provider="NewsAPI.org",
        endpoint="https://newsapi.org/v2/everything",
        api_key_env="NEWSAPI_KEY",
        params_builder=lambda api_key: {
            "q": "transportation OR logistics OR electric vehicle OR autonomous driving",
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": 10,
            "apiKey": api_key,
        },
        parser=_parse_newsapi,
    ),
]


summary_builder = NewsSummaryBuilder()
news_service = IndustryNewsService(INDUSTRY_CONFIGS, summary_builder)

# Anthropic client for generating hooks
anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY")) if os.getenv("ANTHROPIC_API_KEY") else None

# Supabase service for storing news hooks
try:
    supabase_service = SupabaseService()
except Exception as e:
    print(f"Warning: Failed to initialize SupabaseService: {str(e)}")
    supabase_service = None


class IndustryHooksResponse(BaseModel):
    industry: str
    slug: str
    summary: str
    hooks: List[str]


class NewsHooksResponse(BaseModel):
    industries: List[IndustryHooksResponse]
    total_hooks: int


async def generate_hooks_from_summary(summary: str, industry: str, num_hooks: int = 4) -> List[str]:
    """
    Generate LinkedIn post hooks from a news summary using Anthropic.
    
    Args:
        summary: News summary text
        industry: Industry name for context
        num_hooks: Number of hooks to generate (default: 4)
    
    Returns:
        List of LinkedIn post hooks
    """
    if not anthropic_client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Anthropic API key not configured",
        )

    system_prompt = """You are an expert LinkedIn content creator specializing in creating engaging post hooks that grab attention and drive engagement.

Your task is to generate unique LinkedIn post hooks based on news summaries. Each hook should:
1. Be compelling and attention-grabbing
2. Be suitable as the opening line of a LinkedIn post
3. Be 1-2 sentences maximum
4. Create curiosity or urgency
5. Be professional but engaging
6. Focus on generalizable business insights and industry trends
7. Be applicable to any entrepreneur, founder, or business professional within this broad industry
8. Avoid specific product names, company names, or overly specific details
9. Emphasize strategic insights, market trends, and broader implications"""

    user_prompt = f"""Generate {num_hooks} unique LinkedIn post hooks based on this {industry} news summary:

{summary}

Each hook should:
- Extract the broader business insight or industry trend from the news
- Be generalizable and applicable to any business professional
- Focus on strategic implications rather than specific products or companies
- Use patterns like "Here's what [trend] tells us about [broader insight]" or "The [industry] shift that matters for every business"
- Make them diverse in style (questions, statements, insights, etc.)
- Avoid mentioning specific brand names, product launches, or company-specific details unless they illustrate a larger trend

IMPORTANT: Return your response as a JSON object with a "hooks" array containing exactly {num_hooks} hooks. Format:
{{
  "hooks": [
    "Hook 1 text here",
    "Hook 2 text here",
    ...
  ]
}}"""

    try:
        response = anthropic_client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=500,
            temperature=0.8,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_prompt},
            ],
        )

        if not response.content or len(response.content) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Anthropic returned no content",
            )

        # Extract the text content
        response_text = response.content[0].text if response.content[0].type == "text" else ""
        
        if not response_text:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Anthropic returned empty response",
            )

        # Parse the JSON response
        try:
            # Try to extract JSON from the response (might be wrapped in markdown code blocks)
            json_match = re.search(r'\{[^{}]*"hooks"[^{}]*\[[^\]]*\][^{}]*\}', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(0)
            
            function_args = json.loads(response_text)
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error parsing Anthropic response: {str(e)}. Response was: {response_text[:200]}",
            )
        
        hooks = function_args.get("hooks", [])

        if not hooks or len(hooks) != num_hooks:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Expected {num_hooks} hooks, got {len(hooks)}",
            )

        # Clean and validate hooks
        cleaned_hooks = [hook.strip() for hook in hooks if hook.strip()]
        
        if len(cleaned_hooks) != num_hooks:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Expected {num_hooks} valid hooks, got {len(cleaned_hooks)}",
            )

        return cleaned_hooks

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error parsing Anthropic response: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating hooks: {str(e)}",
        )


@router.get("/industries", response_model=List[IndustryInfo])
async def list_industries(request: Request) -> List[IndustryInfo]:
    # Rate limiting check
    client_ip = get_client_ip(request)
    if not news_rate_limiter.check_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later.",
        )
    return news_service.list_industries()


@router.get("/", response_model=BulkIndustryNewsResponse)
async def fetch_multiple_industries(
    request: Request,
    industries: Optional[str] = Query(
        default=None,
        description="Comma-separated list of industry slugs (default = all).",
    ),
    refresh_cache: bool = False,
) -> BulkIndustryNewsResponse:
    # Rate limiting check
    client_ip = get_client_ip(request)
    if not news_rate_limiter.check_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later.",
        )
    slugs = news_service.resolve_slugs(industries)
    tasks: List[Awaitable[IndustryNewsResponse]] = [
        news_service.get_industry_news(slug, refresh_cache=refresh_cache)
        for slug in slugs
    ]
    responses = await asyncio.gather(*tasks, return_exceptions=True)

    results: List[IndustryNewsResponse] = []
    errors: List[Dict[str, Any]] = []

    for slug, result in zip(slugs, responses):
        if isinstance(result, IndustryNewsResponse):
            results.append(result)
            continue

        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        detail: Any = str(result)

        if isinstance(result, HTTPException):
            status_code = result.status_code
            detail = result.detail

        errors.append({"slug": slug, "status_code": status_code, "detail": detail})

    if not results and errors:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"errors": errors},
        )

    return BulkIndustryNewsResponse(results=results, errors=errors)


@router.get("/hooks")
async def get_news_hooks(
    current_user: Annotated[dict, Depends(get_current_user)],
    industry_slug: Optional[str] = Query(
        default=None,
        description="Optional industry slug to filter by (e.g., 'technology', 'finance')",
    ),
    created_after: Optional[str] = Query(
        default=None,
        description="Optional ISO date string (e.g., '2024-01-01T00:00:00Z') - only return hooks created after this date",
    ),
):
    """
    Retrieve news hooks from the database.
    
    Requires authentication. Returns news hooks stored in the news_hooks table, 
    optionally filtered by industry and creation date. Results are ordered by created_at DESC (newest first).
    In practice, we will filter for hooks made in the last week (for trending stories page)
    
    Query Parameters:
    - industry_slug: Optional industry slug to filter by
    - created_after: Optional ISO date string - only return hooks created after this date
    """
    try:
        if not supabase_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is not available",
            )
        
        # Fetch news hooks from database
        hooks_data = await supabase_service.get_news_hooks(
            industry_slug=industry_slug,
            created_after=created_after
        )
        
        return {
            "success": True,
            "data": hooks_data,
            "count": len(hooks_data),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving news hooks: {str(e)}",
        )


@router.get("/{industry_slug}", response_model=IndustryNewsResponse)
async def fetch_industry_news(
    industry_slug: str,
    request: Request,
    refresh_cache: bool = False,
) -> IndustryNewsResponse:
    # Rate limiting check
    client_ip = get_client_ip(request)
    if not news_rate_limiter.check_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later.",
        )
    return await news_service.get_industry_news(industry_slug, refresh_cache)


@router.post("/generate-hooks", response_model=NewsHooksResponse)
async def generate_news_hooks(
    request: Request,
    refresh_cache: bool = False,
    authorization: Annotated[Optional[str], Header()] = None,
):
    """
    Generate LinkedIn post hooks from news summaries for all industries.
    
    Requires API token authentication via Authorization header: "Bearer <token>"
    
    For each industry:
    1. Fetches latest news and summary
    2. Generates 4 LinkedIn post hooks based on the summary
    
    Returns hooks organized by industry.
    """
    try:
        # Simple token authentication
        verify_api_token(authorization)
        
        # Rate limiting check
        client_ip = get_client_ip(request)
        if not news_rate_limiter.check_rate_limit(client_ip):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
            )
        
        # Fetch news from all industries
        slugs = news_service.resolve_slugs(None)
        tasks: List[Awaitable[IndustryNewsResponse]] = [
            news_service.get_industry_news(slug, refresh_cache=refresh_cache)
            for slug in slugs
        ]
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process each industry and generate hooks
        industry_hooks: List[IndustryHooksResponse] = []
        
        for slug, result in zip(slugs, responses):
            if isinstance(result, HTTPException):
                # Skip industries that failed
                print(f"Skipping {slug}: HTTPException - {result.detail}")
                continue
            
            if not isinstance(result, IndustryNewsResponse):
                # Skip other errors
                print(f"Skipping {slug}: Unexpected error type - {type(result)}: {str(result)}")
                continue
            
            # Generate 4 hooks from the summary
            try:
                hooks = await generate_hooks_from_summary(
                    summary=result.summary,
                    industry=result.industry,
                    num_hooks=4
                )
                
                # Store in Supabase
                if supabase_service:
                    try:
                        await supabase_service.store_news_hooks(
                            industry=result.industry,
                            industry_slug=result.slug,
                            summary=result.summary,
                            hooks=hooks
                        )
                    except Exception as e:
                        # Log error but don't fail the request
                        print(f"Warning: Failed to store news hooks for {result.industry} in database: {str(e)}")
                else:
                    print("Warning: SupabaseService not initialized, skipping database storage")
                
                industry_hooks.append(
                    IndustryHooksResponse(
                        industry=result.industry,
                        slug=result.slug,
                        summary=result.summary,
                        hooks=hooks,
                    )
                )
            except Exception as e:
                # Log error but continue with other industries
                print(f"Error generating hooks for {result.industry}: {str(e)}")
                import traceback
                traceback.print_exc()
                continue
        
        if not industry_hooks:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate hooks for any industries. Check server logs for details.",
            )
        
        total_hooks = sum(len(ih.hooks) for ih in industry_hooks)
        
        return NewsHooksResponse(
            industries=industry_hooks,
            total_hooks=total_hooks,
        )
    except HTTPException:
        # Re-raise HTTP exceptions (auth, rate limit, etc.)
        raise
    except Exception as e:
        # Catch any unexpected errors and provide better error message
        import traceback
        error_trace = traceback.format_exc()
        print(f"Unexpected error in generate_news_hooks: {str(e)}")
        print(error_trace)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}",
        )

