"""Email service using Resend."""
import resend
from datetime import datetime
from typing import Optional
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import async_session_maker
from app.models.email_log import EmailLog
from app.models.user import User
from app.models.economy import NewsArticle


async def send_email(
    to: str,
    subject: str,
    html: str,
    user_id: Optional[str] = None,
    email_type: str = "general",
) -> bool:
    """Send an email using Resend API."""
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        return False

    try:
        resend.api_key = settings.RESEND_API_KEY

        params = {
            "from": settings.EMAIL_FROM,
            "to": [to],
            "subject": subject,
            "html": html,
        }

        resend.Emails.send(params)
        logger.info(f"Email sent to {to}: {subject}")

        # Log email if user_id provided
        if user_id:
            async with async_session_maker() as db:
                email_log = EmailLog(
                    user_id=user_id,
                    email_type=email_type,
                    status="sent",
                )
                db.add(email_log)
                await db.commit()

        return True

    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")

        if user_id:
            async with async_session_maker() as db:
                email_log = EmailLog(
                    user_id=user_id,
                    email_type=email_type,
                    status="failed",
                )
                db.add(email_log)
                await db.commit()

        return False


def generate_economy_briefing_html(news_articles: list[NewsArticle]) -> str:
    """Generate HTML content for economy briefing email."""
    today = datetime.now().strftime("%Y년 %m월 %d일")

    # Group articles by category
    categories = {}
    for article in news_articles:
        cat = article.category or "기타"
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(article)

    category_names = {
        "ai": "AI",
        "cloud": "클라우드",
        "security": "보안",
        "startup": "스타트업",
        "tech": "기술",
    }

    articles_html = ""
    for cat, articles in categories.items():
        cat_name = category_names.get(cat, cat)
        articles_html += f"""
        <h3 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 8px; margin-top: 24px;">
            {cat_name}
        </h3>
        """
        for article in articles[:5]:  # Max 5 per category
            sentiment_color = {
                "positive": "#28a745",
                "negative": "#dc3545",
                "neutral": "#6c757d",
            }.get(article.sentiment, "#6c757d")

            sentiment_text = {
                "positive": "긍정",
                "negative": "부정",
                "neutral": "중립",
            }.get(article.sentiment, "중립")

            articles_html += f"""
            <div style="margin: 16px 0; padding: 16px; background: #f8f9fa; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <a href="{article.url}" style="color: #007bff; text-decoration: none; font-weight: 600; font-size: 16px;">
                        {article.title}
                    </a>
                    <span style="color: {sentiment_color}; font-size: 12px; padding: 2px 8px; background: white; border-radius: 4px;">
                        {sentiment_text}
                    </span>
                </div>
                <p style="color: #666; margin: 8px 0 0; font-size: 14px; line-height: 1.6;">
                    {article.summary or ''}
                </p>
                <div style="color: #999; font-size: 12px; margin-top: 8px;">
                    {article.source} · {article.published_at.strftime('%m/%d %H:%M') if article.published_at else ''}
                </div>
            </div>
            """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #333; margin: 0;">📰 오늘의 IT 뉴스 브리핑</h1>
            <p style="color: #666; margin: 8px 0 0;">{today}</p>
        </div>

        {articles_html}

        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
                Personal AI Hub에서 발송된 이메일입니다.
            </p>
        </div>
    </body>
    </html>
    """

    return html


async def send_economy_briefing(user: User) -> bool:
    """Send daily economy briefing email to user."""
    # Check if user has email enabled
    economy_settings = user.settings.get("economy", {}) if user.settings else {}
    if not economy_settings.get("email_enabled", True):
        logger.info(f"Email disabled for user {user.email}")
        return False

    # Get today's news articles
    async with async_session_maker() as db:
        result = await db.execute(
            select(NewsArticle)
            .order_by(NewsArticle.published_at.desc())
            .limit(30)
        )
        articles = result.scalars().all()

    if not articles:
        logger.info("No news articles to send")
        return False

    # Generate and send email
    html = generate_economy_briefing_html(articles)
    subject = f"📰 오늘의 IT 뉴스 브리핑 - {datetime.now().strftime('%m월 %d일')}"

    return await send_email(
        to=user.email,
        subject=subject,
        html=html,
        user_id=str(user.id),
        email_type="economy_digest",
    )


async def send_all_economy_briefings():
    """Send economy briefing to all users who have it enabled."""
    logger.info("Starting economy briefing email job...")

    async with async_session_maker() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()

    sent_count = 0
    for user in users:
        economy_settings = user.settings.get("economy", {}) if user.settings else {}
        if economy_settings.get("email_enabled", False):
            success = await send_economy_briefing(user)
            if success:
                sent_count += 1

    logger.info(f"Economy briefing sent to {sent_count} users")
    return sent_count
