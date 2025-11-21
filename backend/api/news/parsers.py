from typing import Any, Dict, List


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

