"""News fetching service for Economy AI."""
import asyncio
from datetime import datetime
from typing import Optional
import feedparser
import httpx
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_maker
from app.core.config import settings
from app.models.economy import NewsArticle

# RSS Feed sources categorized by topic
RSS_FEEDS = {
    "ai": [
        ("https://news.google.com/rss/search?q=artificial+intelligence&hl=ko&gl=KR&ceid=KR:ko", "Google News"),
        ("https://news.google.com/rss/search?q=ChatGPT+OR+GPT+OR+LLM&hl=ko&gl=KR&ceid=KR:ko", "Google News"),
    ],
    "cloud": [
        ("https://news.google.com/rss/search?q=cloud+computing+AWS+Azure&hl=ko&gl=KR&ceid=KR:ko", "Google News"),
    ],
    "security": [
        ("https://news.google.com/rss/search?q=cybersecurity+사이버보안&hl=ko&gl=KR&ceid=KR:ko", "Google News"),
    ],
    "startup": [
        ("https://news.google.com/rss/search?q=스타트업+투자&hl=ko&gl=KR&ceid=KR:ko", "Google News"),
    ],
    "tech": [
        ("https://hnrss.org/newest?points=100", "Hacker News"),
        ("https://news.google.com/rss/search?q=IT+기술+테크&hl=ko&gl=KR&ceid=KR:ko", "Google News"),
    ],
}


async def fetch_rss_feed(url: str, source: str, category: str) -> list[dict]:
    """Fetch articles from an RSS feed."""
    articles = []

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()

        feed = feedparser.parse(response.text)

        for entry in feed.entries[:10]:  # Limit to 10 per feed
            published_at = None
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                published_at = datetime(*entry.published_parsed[:6])
            elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                published_at = datetime(*entry.updated_parsed[:6])

            article = {
                "title": entry.get("title", "").strip(),
                "url": entry.get("link", ""),
                "source": source,
                "category": category,
                "original_content": entry.get("summary", entry.get("description", "")),
                "published_at": published_at or datetime.utcnow(),
            }

            if article["title"] and article["url"]:
                articles.append(article)

    except Exception as e:
        logger.error(f"Failed to fetch RSS feed {url}: {e}")

    return articles


async def summarize_and_analyze(article: dict) -> dict:
    """Use AI to summarize article and analyze sentiment."""
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI

        if not settings.GOOGLE_API_KEY:
            # Fallback: use first 200 chars as summary
            article["summary"] = article.get("original_content", "")[:200] + "..."
            article["sentiment"] = "neutral"
            return article

        llm = ChatGoogleGenerativeAI(
            model="gemini-3-flash-preview",
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.3,
        )

        content = article.get("original_content", "")[:1000]
        title = article.get("title", "")

        prompt = f"""다음 뉴스 기사를 분석해주세요.

제목: {title}
내용: {content}

다음 형식으로 응답해주세요:
요약: (2-3문장으로 핵심 내용 요약)
감정: (positive/negative/neutral 중 하나)"""

        response = await asyncio.to_thread(llm.invoke, prompt)
        result = response.content

        # Parse response
        lines = result.strip().split("\n")
        summary = ""
        sentiment = "neutral"

        for line in lines:
            if line.startswith("요약:"):
                summary = line.replace("요약:", "").strip()
            elif line.startswith("감정:"):
                sentiment_text = line.replace("감정:", "").strip().lower()
                if "positive" in sentiment_text or "긍정" in sentiment_text:
                    sentiment = "positive"
                elif "negative" in sentiment_text or "부정" in sentiment_text:
                    sentiment = "negative"
                else:
                    sentiment = "neutral"

        article["summary"] = summary or content[:200] + "..."
        article["sentiment"] = sentiment

    except Exception as e:
        logger.error(f"Failed to analyze article: {e}")
        article["summary"] = article.get("original_content", "")[:200] + "..."
        article["sentiment"] = "neutral"

    return article


async def store_article(db: AsyncSession, article: dict) -> Optional[NewsArticle]:
    """Store article in database if not exists."""
    try:
        # Check if article already exists by URL
        result = await db.execute(
            select(NewsArticle).where(NewsArticle.url == article["url"])
        )
        existing = result.scalar_one_or_none()

        if existing:
            return None

        news_article = NewsArticle(
            title=article["title"],
            url=article["url"],
            source=article["source"],
            category=article["category"],
            original_content=article.get("original_content"),
            summary=article.get("summary"),
            sentiment=article.get("sentiment"),
            published_at=article.get("published_at"),
        )

        db.add(news_article)
        await db.commit()
        await db.refresh(news_article)

        return news_article

    except Exception as e:
        logger.error(f"Failed to store article: {e}")
        await db.rollback()
        return None


async def fetch_and_store_news() -> dict:
    """Main function to fetch news from all sources and store in database."""
    logger.info("Starting news fetch job...")

    stats = {
        "fetched": 0,
        "stored": 0,
        "skipped": 0,
        "errors": 0,
    }

    all_articles = []

    # Fetch from all RSS feeds
    for category, feeds in RSS_FEEDS.items():
        for url, source in feeds:
            articles = await fetch_rss_feed(url, source, category)
            all_articles.extend(articles)
            stats["fetched"] += len(articles)

            # Small delay between feeds
            await asyncio.sleep(0.5)

    logger.info(f"Fetched {stats['fetched']} articles from RSS feeds")

    # Process and store articles
    async with async_session_maker() as db:
        for article in all_articles:
            try:
                # Analyze with AI
                analyzed = await summarize_and_analyze(article)

                # Store in database
                stored = await store_article(db, analyzed)

                if stored:
                    stats["stored"] += 1
                else:
                    stats["skipped"] += 1

            except Exception as e:
                logger.error(f"Error processing article: {e}")
                stats["errors"] += 1

    logger.info(f"News fetch completed: {stats}")
    return stats


async def cleanup_old_news(days: int = 30):
    """Remove news articles older than specified days."""
    from datetime import timedelta
    from sqlalchemy import delete

    cutoff = datetime.utcnow() - timedelta(days=days)

    async with async_session_maker() as db:
        result = await db.execute(
            delete(NewsArticle).where(NewsArticle.published_at < cutoff)
        )
        await db.commit()

        logger.info(f"Cleaned up {result.rowcount} old news articles")
