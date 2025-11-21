import asyncio
import os
import time
from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Dict, List, Optional

import httpx
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.concurrency import run_in_threadpool
from openai import OpenAI
from pydantic import BaseModel, Field


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
    documentation_url: str
    articles: List[Article]
    summary: str
    coverage_notes: str


class BulkIndustryNewsResponse(BaseModel):
    results: List[IndustryNewsResponse]
    errors: List[Dict[str, Any]]


class IndustryInfo(BaseModel):
    slug: str
    industry: str
    provider: str
    documentation_url: str
    requires_api_key: bool
    api_key_env: Optional[str] = None
    coverage_notes: str
    is_configured: bool


class MissingAPIKey(Exception):
    """Raised when an API requires a key that is not configured."""


@dataclass
class IndustryAPIConfig:
    slug: str
    industry: str
    provider: str
    documentation_url: str
    endpoint: str
    coverage_notes: str
    params_builder: Callable[[Optional[str]], Dict[str, Any]]
    parser: Callable[[Dict[str, Any]], List[Dict[str, Any]]]
    requires_api_key: bool = True
    api_key_env: Optional[str] = None
    timeout: float = 10.0


def _parse_gnews(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    articles = []
    for item in payload.get("articles", []):
        articles.append(
            {
                "title": item.get("title"),
                "description": item.get("description"),
                "url": item.get("url"),
                "published_at": item.get("publishedAt"),
                "source": (item.get("source") or {}).get("name"),
            }
        )
    return articles


def _parse_fmp(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    articles = []
    for item in payload:
        articles.append(
            {
                "title": item.get("title"),
                "description": item.get("text"),
                "url": item.get("url"),
                "published_at": item.get("publishedDate"),
                "source": item.get("site"),
            }
        )
    return articles


def _parse_newsdata(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    articles = []
    for item in payload.get("results", []):
        articles.append(
            {
                "title": item.get("title"),
                "description": item.get("description") or item.get("content"),
                "url": item.get("link"),
                "published_at": item.get("pubDate"),
                "source": item.get("source_id"),
            }
        )
    return articles


def _parse_gdelt(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    articles = []
    for item in payload.get("articles", []):
        articles.append(
            {
                "title": item.get("title"),
                "description": item.get("seendate"),
                "url": item.get("url"),
                "published_at": item.get("seendate"),
                "source": item.get("sourceCommonName") or item.get("sourceCountry"),
            }
        )
    return articles


def _parse_guardian(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    response = payload.get("response", {})
    results = response.get("results", [])
    articles = []
    for item in results:
        fields = item.get("fields", {})
        articles.append(
            {
                "title": item.get("webTitle"),
                "description": fields.get("trailText") or fields.get("headline"),
                "url": item.get("webUrl"),
                "published_at": item.get("webPublicationDate"),
                "source": "The Guardian",
            }
        )
    return articles


def _parse_newsapi(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    articles = []
    for item in payload.get("articles", []):
        source = item.get("source") or {}
        articles.append(
            {
                "title": item.get("title"),
                "description": item.get("description"),
                "url": item.get("url"),
                "published_at": item.get("publishedAt"),
                "source": source.get("name"),
            }
        )
    return articles


def _parse_alphavantage(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    articles = []
    for item in payload.get("feed", []):
        articles.append(
            {
                "title": item.get("title"),
                "description": item.get("summary"),
                "url": item.get("url"),
                "published_at": item.get("time_published"),
                "source": item.get("source"),
            }
        )
    return articles[:10]


INDUSTRY_CONFIGS: List[IndustryAPIConfig] = [
    IndustryAPIConfig(
        slug="technology",
        industry="Technology & AI",
        provider="GNews",
        documentation_url="https://gnews.io/docs/v4",
        endpoint="https://gnews.io/api/v4/top-headlines",
        coverage_notes="Global English-language technology coverage sourced by GNews' curated feeds.",
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
        industry="Financial Markets",
        provider="Alpha Vantage",
        documentation_url="https://www.alphavantage.co/documentation/#news",
        endpoint="https://www.alphavantage.co/query",
        coverage_notes="Alpha Vantage's news sentiment feed covering global equities, ETFs, and macro signals.",
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
        industry="Healthcare & Life Sciences",
        provider="NewsData.io",
        documentation_url="https://newsdata.io/documentation",
        endpoint="https://newsdata.io/api/1/news",
        coverage_notes="Healthcare-specific stream leveraging NewsData categories for hospitals, biotech, and payor topics.",
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
        industry="Energy & Climate",
        provider="GDELT Project",
        documentation_url="https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/",
        endpoint="https://api.gdeltproject.org/api/v2/doc/doc",
        coverage_notes="Worldwide climate, renewables, and oil & gas sentiment feed from the open GDELT event graph.",
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
        slug="consumer",
        industry="Retail & Consumer",
        provider="The Guardian Open Platform",
        documentation_url="https://open-platform.theguardian.com/documentation/",
        endpoint="https://content.guardianapis.com/search",
        coverage_notes="Retail-focused lens on the Guardian business desk including earnings, DTC, and CPG.",
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
        slug="mobility",
        industry="Mobility & Transportation",
        provider="NewsAPI.org",
        documentation_url="https://newsapi.org/docs",
        endpoint="https://newsapi.org/v2/everything",
        coverage_notes="Broader surface area over logistics, EV, and transportation infrastructure signals filtered by NewsAPI.",
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


class NewsSummaryBuilder:
    """Generates condensed summaries with OpenAI when available."""

    def __init__(self) -> None:
        api_key = os.getenv("OPENAI_API_KEY")
        self.client: Optional[OpenAI] = OpenAI(api_key=api_key) if api_key else None

    async def build_summary(
        self, industry: str, provider: str, articles: List[Article]
    ) -> str:
        top_headlines = [article.title for article in articles if article.title][:5]
        if not top_headlines:
            return f"No recent {industry.lower()} headlines are available."

        if not self.client:
            return self._build_fallback_summary(industry, top_headlines)

        try:
            return await run_in_threadpool(
                self._call_llm, industry, provider, articles[:5]
            )
        except Exception:
            return self._build_fallback_summary(industry, top_headlines)

    def _build_fallback_summary(self, industry: str, headlines: List[str]) -> str:
        joined = "; ".join(headlines)
        return f"{industry} snapshot: {joined}"

    def _call_llm(
        self, industry: str, provider: str, articles: List[Article]
    ) -> str:
        if not self.client:
            return self._build_fallback_summary(industry, [a.title for a in articles])

        bullet_lines = []
        for article in articles:
            description = article.description or ""
            bullet_lines.append(f"- {article.title}: {description}")

        prompt = (
            "Summarize the following industry headlines into 2 concise sentences "
            "calling out the most actionable developments.\n"
            f"Industry: {industry}\n"
            f"Provider: {provider}\n"
            f"Headlines:\n{os.linesep.join(bullet_lines)}"
        )

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a chief-of-staff producing sharp competitive briefs.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=200,
        )
        content = response.choices[0].message.content if response.choices else None
        if not content:
            return self._build_fallback_summary(industry, [a.title for a in articles])
        return content.strip()


class IndustryNewsService:
    def __init__(self, configs: List[IndustryAPIConfig], summary_builder: NewsSummaryBuilder, cache_ttl_seconds: int = 300) -> None:
        self._summary_builder = summary_builder
        self._configs = {config.slug: config for config in configs}
        self._cache: Dict[str, Any] = {}
        self._cache_ttl = cache_ttl_seconds

    def list_industries(self) -> List[IndustryInfo]:
        industries = []
        for config in self._configs.values():
            api_key_present = (
                bool(os.getenv(config.api_key_env)) if config.api_key_env else True
            )
            industries.append(
                IndustryInfo(
                    slug=config.slug,
                    industry=config.industry,
                    provider=config.provider,
                    documentation_url=config.documentation_url,
                    requires_api_key=config.requires_api_key,
                    api_key_env=config.api_key_env,
                    coverage_notes=config.coverage_notes,
                    is_configured=api_key_present,
                )
            )
        return industries

    def _get_config(self, slug: str) -> IndustryAPIConfig:
        config = self._configs.get(slug)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Unknown industry slug '{slug}'. Available options: {', '.join(self._configs.keys())}",
            )
        return config

    async def get_industry_news(
        self, slug: str, refresh_cache: bool = False
    ) -> IndustryNewsResponse:
        config = self._get_config(slug)

        if not refresh_cache:
            cached = self._cache.get(slug)
            if cached and (time.time() - cached["timestamp"] <= self._cache_ttl):
                return cached["payload"]

        api_key = None
        if config.requires_api_key:
            api_key = os.getenv(config.api_key_env or "")
            if not api_key:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"{config.provider} API key missing. Set {config.api_key_env} to enable {config.industry} coverage.",
                )

        try:
            payload = await self._execute_request(config, api_key)
            articles_dicts = config.parser(payload)
        except MissingAPIKey:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"{config.provider} configuration incomplete. Please set {config.api_key_env}.",
            )
        except httpx.TimeoutException as exc:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=f"{config.provider} timed out: {exc}",
            )
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"{config.provider} request failed: {exc}",
            )

        articles = [Article(**article) for article in articles_dicts if article.get("title") and article.get("url")]

        summary = await self._summary_builder.build_summary(
            config.industry, config.provider, articles
        )

        response = IndustryNewsResponse(
            industry=config.industry,
            slug=config.slug,
            provider=config.provider,
            documentation_url=config.documentation_url,
            articles=articles,
            summary=summary,
            coverage_notes=config.coverage_notes,
        )

        self._cache[slug] = {"timestamp": time.time(), "payload": response}
        return response

    async def _execute_request(
        self, config: IndustryAPIConfig, api_key: Optional[str]
    ) -> Dict[str, Any]:
        if config.requires_api_key and not api_key:
            raise MissingAPIKey

        params = config.params_builder(api_key)

        async with httpx.AsyncClient(timeout=config.timeout) as client:
            response = await client.get(config.endpoint, params=params)
            response.raise_for_status()
            return response.json()

    def resolve_slugs(self, requested: Optional[str]) -> List[str]:
        if not requested:
            return list(self._configs.keys())
        slugs = [slug.strip() for slug in requested.split(",") if slug.strip()]
        if not slugs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid industries were provided.",
            )
        for slug in slugs:
            self._get_config(slug)
        # deduplicate while preserving order
        seen = set()
        ordered = []
        for slug in slugs:
            if slug not in seen:
                ordered.append(slug)
                seen.add(slug)
        return ordered


summary_builder = NewsSummaryBuilder()
news_service = IndustryNewsService(INDUSTRY_CONFIGS, summary_builder)


@router.get("/industries", response_model=List[IndustryInfo])
async def list_industries() -> List[IndustryInfo]:
    return news_service.list_industries()


@router.get("/", response_model=BulkIndustryNewsResponse)
async def fetch_multiple_industries(
    industries: Optional[str] = Query(
        default=None,
        description="Comma-separated list of industry slugs (default = all).",
    ),
    refresh_cache: bool = False,
) -> BulkIndustryNewsResponse:
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
    industry_slug: str, refresh_cache: bool = False
) -> IndustryNewsResponse:
    return await news_service.get_industry_news(industry_slug, refresh_cache)
