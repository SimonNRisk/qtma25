import asyncio
from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Request, status
from pydantic import BaseModel, Field

from utils.rate_limit import news_rate_limiter, get_client_ip

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


class Article(BaseModel):
    title: str
    description: Optional[str] = None
    url: str
    published_at: Optional[str] = Field(default=None, alias="publishedAt")
    source: Optional[str] = None


class IndustryNewsResponse(BaseModel):
    industry: str
    slug: str
    provider: str
    articles: List[Article]
    summary: str


class BulkIndustryNewsResponse(BaseModel):
    results: List[IndustryNewsResponse]
    errors: List[Dict[str, Any]]


class IndustryInfo(BaseModel):
    slug: str
    industry: str
    provider: str
    requires_api_key: bool
    api_key_env: Optional[str] = None
    is_configured: bool


class MissingAPIKey(Exception):
    """Raised when an API requires a key that is not configured."""


@dataclass
class IndustryAPIConfig:
    slug: str
    industry: str
    provider: str
    endpoint: str
    params_builder: Callable[[Optional[str]], Dict[str, Any]]
    parser: Callable[[Dict[str, Any]], List[Dict[str, Any]]]
    requires_api_key: bool = True
    api_key_env: Optional[str] = None
    timeout: float = 10.0


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

