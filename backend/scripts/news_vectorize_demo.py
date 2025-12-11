"""
Quick demo script: fetch industry news, summarize, chunk, and vectorize to Qdrant.

Usage:
    # Set env: OPENAI_API_KEY, QDRANT_URL, QDRANT_KEY, required news API keys.
    # Optional: TEST_USER_ID to control the user scope for Qdrant.
    python -m backend.scripts.news_vectorize_demo --slug technology --query "AI model reduces inference costs"
"""

import argparse
import asyncio
import os
from typing import List

from api.news.news import INDUSTRY_CONFIGS
from api.news.service import IndustryNewsService
from api.news.summary_builder import NewsSummaryBuilder
from services.qdrant_service import QdrantService


def chunk_text(text: str, chunk_size: int = 600) -> List[str]:
    """Simple character-based chunking to keep embeddings short."""
    text = text.strip()
    if not text:
        return []
    return [text[i : i + chunk_size] for i in range(0, len(text), chunk_size)]


async def run(slug: str, user_id: str, query: str) -> None:
    summary_builder = NewsSummaryBuilder()
    news_service = IndustryNewsService(INDUSTRY_CONFIGS, summary_builder)

    print(f"Fetching news for slug='{slug}'...")
    news = await news_service.get_industry_news(slug, refresh_cache=True)
    print(f"Summary:\n{news.summary}\n")

    qdrant = QdrantService()
    print("Upserting chunks into Qdrant...")
    inserted = 0

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
            },
            user_id=user_id,
        )
        inserted += 1

    # Add articles as chunks
    for article_idx, article in enumerate(news.articles):
        body = f"{article.title}. {article.description or ''}"
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
                    "title": article.title,
                    "article_idx": article_idx,
                    "chunk_idx": chunk_idx,
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
        )
        for m in matches:
            payload = m.get("payload") or {}
            print(f"- score={m.get('score'):.4f} title={payload.get('title')} type={payload.get('type')} url={payload.get('url')}")


def main() -> None:
    parser = argparse.ArgumentParser(description="News -> Qdrant demo")
    parser.add_argument("--slug", default="technology", help="Industry slug (e.g., technology, finance)")
    parser.add_argument("--user-id", default=os.getenv("TEST_USER_ID", "news-demo-user"), help="User scope for Qdrant payloads")
    parser.add_argument("--query", default="AI model reduces inference costs", help="Search query after indexing")
    args = parser.parse_args()

    asyncio.run(run(args.slug, args.user_id, args.query))


if __name__ == "__main__":
    main()
