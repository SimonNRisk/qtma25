import os
from typing import TYPE_CHECKING, List, Optional

from fastapi.concurrency import run_in_threadpool
from openai import OpenAI

if TYPE_CHECKING:
    from .models import Article


class NewsSummaryBuilder:
    """Generates condensed summaries with OpenAI when available."""

    def __init__(self) -> None:
        api_key = os.getenv("OPENAI_API_KEY")
        self.client: Optional[OpenAI] = OpenAI(api_key=api_key) if api_key else None

    async def build_summary(
        self, industry: str, provider: str, articles: List["Article"]
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
        self, industry: str, provider: str, articles: List["Article"]
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

