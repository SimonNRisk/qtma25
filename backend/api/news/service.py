import os
import time
from typing import Any, Dict, List, Optional

import httpx
from fastapi import HTTPException, status

from .news import (
    Article,
    IndustryAPIConfig,
    IndustryInfo,
    IndustryNewsResponse,
    MissingAPIKey,
)


class IndustryNewsService:
    def __init__(self, configs: List[IndustryAPIConfig], summary_builder, cache_ttl_seconds: int = 300) -> None:
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
                    requires_api_key=config.requires_api_key,
                    api_key_env=config.api_key_env,
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
            articles=articles,
            summary=summary,
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

