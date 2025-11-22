from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional

from pydantic import BaseModel, Field


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

