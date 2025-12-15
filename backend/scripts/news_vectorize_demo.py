"""
Quick demo script: fetch industry news, summarize, chunk, and vectorize to Qdrant.

Usage:
    # Set env: OPENAI_API_KEY, QDRANT_URL, QDRANT_KEY, required news API keys.
    # Optional: TEST_USER_ID to control the user scope for Qdrant.
    python -m backend.scripts.news_vectorize_demo --slug technology --query "AI model reduces inference costs"
"""

import argparse
import asyncio
from datetime import datetime, timezone
import os
import re
from typing import List, Optional

import httpx

try:
    import trafilatura
except Exception:  # noqa: BLE001
    trafilatura = None

try:
    # When running from repo root: python -m backend.scripts.news_vectorize_demo
    from backend.api.news.news import INDUSTRY_CONFIGS
    from backend.api.news.service import IndustryNewsService
    from backend.api.news.summary_builder import NewsSummaryBuilder
    from backend.services.qdrant_service import QdrantService
except ModuleNotFoundError:
    # When running from backend/: python -m scripts.news_vectorize_demo
    from api.news.news import INDUSTRY_CONFIGS
    from api.news.service import IndustryNewsService
    from api.news.summary_builder import NewsSummaryBuilder
    from services.qdrant_service import QdrantService


def split_sentences(text: str) -> List[str]:
    # Basic sentence splitter; keeps punctuation
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


def chunk_text(
    text: str,
    max_chars: int = 800,
    overlap: int = 120,
    min_chunk_chars: int = 120,
) -> List[str]:
    """Sentence-aware chunking with optional overlap; drops very small chunks."""
    text = (text or "").strip()
    if not text:
        return []

    sentences = split_sentences(text)
    if not sentences:
        sentences = [text]

    chunks: List[str] = []
    current = ""

    for sent in sentences:
        if not current:
            current = sent
            continue

        if len(current) + 1 + len(sent) <= max_chars:
            current = f"{current} {sent}"
        else:
            if len(current) >= min_chunk_chars:
                chunks.append(current.strip())
            # carry overlap from tail of current into next chunk
            tail = current[-overlap:] if overlap > 0 else ""
            current = f"{tail} {sent}".strip()

    if current and len(current) >= min_chunk_chars:
        chunks.append(current.strip())

    return chunks


def parse_datetime_to_ts(dt_str: Optional[str]) -> Optional[float]:
    if not dt_str:
        return None
    try:
        # Handle trailing Z
        cleaned = dt_str.replace("Z", "+00:00")
        return datetime.fromisoformat(cleaned).timestamp()
    except Exception:
        return None


def extract_article_text(html_text: str) -> str:
    """Use trafilatura when available; fallback to plain regex stripping."""
    if not html_text:
        return ""
    if trafilatura:
        try:
            extracted = trafilatura.extract(html_text, include_comments=False, include_images=False)
            if extracted and extracted.strip():
                return extracted.strip()
        except Exception:
            pass
    # Fallback: strip tags and collapse whitespace
    cleaned = re.sub(r"(?is)<(script|style)[^>]*>.*?</\\1>", " ", html_text)
    cleaned = re.sub(r"(?s)<[^>]+>", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


async def fetch_article_body(url: str, client: httpx.AsyncClient) -> str:
    """Fetch and sanitize the full article body; falls back to empty string on failure."""
    if not url:
        return ""
    try:
        resp = await client.get(url, follow_redirects=True)
        resp.raise_for_status()
        return extract_article_text(resp.text)
    except Exception as exc:  # noqa: BLE001 - we want to keep going on any fetch error
        print(f"Warning: failed to fetch full article from {url}: {exc}")
        return ""


async def run(slug: str, user_id: str, query: str, recent_days: Optional[int]) -> None:
    summary_builder = NewsSummaryBuilder()
    news_service = IndustryNewsService(INDUSTRY_CONFIGS, summary_builder)

    print(f"Fetching news for slug='{slug}'...")
    news = await news_service.get_industry_news(slug, refresh_cache=True)
    print(f"Summary:\n{news.summary}\n")

    qdrant = QdrantService()
    print("Upserting chunks into Qdrant...")
    inserted = 0

    indexed_at = datetime.now(timezone.utc)
    indexed_iso = indexed_at.isoformat()
    indexed_ts = indexed_at.timestamp()

    # Add summary as a chunk
    for idx, chunk in enumerate(chunk_text(news.summary, 800)):
        qdrant.upsert_document(
            content=chunk,
            metadata={
                "type": "news_summary",
                "industry": news.industry,
                "slug": news.slug,
                "source": news.provider,
                "chunk_idx": idx,
                "indexed_at": indexed_iso,
                "indexed_ts": indexed_ts,
            },
            user_id=user_id,
        )
        inserted += 1

    # Add articles as chunks using full body when available
    async with httpx.AsyncClient(timeout=10) as fetch_client:
        for article_idx, article in enumerate(news.articles):
            full_body = await fetch_article_body(article.url, fetch_client)
            body = full_body or f"{article.title}. {article.description or ''}"
            published_ts = parse_datetime_to_ts(article.published_at)

            # Deduplicate by URL for this user before inserting
            if article.url:
                qdrant.delete_by_url(article.url, user_id)

            for chunk_idx, chunk in enumerate(chunk_text(body, 800)):
                qdrant.upsert_document(
                    content=chunk,
                    metadata={
                        "type": "news_article",
                        "industry": news.industry,
                        "slug": news.slug,
                        "source": article.source or news.provider,
                        "url": article.url,
                        "published_at": article.published_at,
                        "published_ts": published_ts,
                        "indexed_at": indexed_iso,
                        "indexed_ts": indexed_ts,
                        "title": article.title,
                        "article_idx": article_idx,
                        "chunk_idx": chunk_idx,
                        "full_text_fetched": bool(full_body),
                    },
                    user_id=user_id,
                )
                inserted += 1

    print(f"Inserted {inserted} chunks.")

    # Optional search
    if query:
        print(f"\nSearching Qdrant for: '{query}'")
        matches = qdrant.search(
            query=query,
            user_id=user_id,
            top_k=5,
            recent_days=recent_days,
        )
        for m in matches:
            payload = m.get("payload") or {}
            print(f"- score={m.get('score'):.4f} title={payload.get('title')} type={payload.get('type')} url={payload.get('url')}")


def main() -> None:
    parser = argparse.ArgumentParser(description="News -> Qdrant demo")
    parser.add_argument("--slug", default="technology", help="Industry slug (e.g., technology, finance)")
    parser.add_argument("--user-id", default=os.getenv("TEST_USER_ID", "news-demo-user"), help="User scope for Qdrant payloads")
    parser.add_argument("--query", default="AI model reduces inference costs", help="Search query after indexing")
    parser.add_argument("--recent-days", type=int, default=7, help="Restrict search results to documents newer than N days (0 to disable)")
    args = parser.parse_args()

    recent_days = args.recent_days if args.recent_days and args.recent_days > 0 else None
    asyncio.run(run(args.slug, args.user_id, args.query, recent_days))


if __name__ == "__main__":
    main()
