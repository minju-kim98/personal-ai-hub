"""APScheduler configuration for background tasks."""
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from loguru import logger

from app.core.config import settings

# Global scheduler instance
scheduler: AsyncIOScheduler | None = None


def get_scheduler() -> AsyncIOScheduler:
    """Get or create scheduler instance."""
    global scheduler
    if scheduler is None:
        scheduler = AsyncIOScheduler()
    return scheduler


async def _run_news_fetch():
    """Wrapper to run news fetch in async context."""
    from app.tasks.news_fetcher import fetch_and_store_news
    try:
        await fetch_and_store_news()
    except Exception as e:
        logger.error(f"News fetch job failed: {e}")


async def _run_news_cleanup():
    """Wrapper to run news cleanup in async context."""
    from app.tasks.news_fetcher import cleanup_old_news
    try:
        await cleanup_old_news(days=30)
    except Exception as e:
        logger.error(f"News cleanup job failed: {e}")


async def _run_economy_briefing():
    """Wrapper to run economy briefing email in async context."""
    from app.services.email import send_all_economy_briefings
    try:
        await send_all_economy_briefings()
    except Exception as e:
        logger.error(f"Economy briefing job failed: {e}")


def start_scheduler():
    """Start the scheduler with configured jobs."""
    global scheduler
    scheduler = get_scheduler()

    # Add news fetch job - runs every 6 hours
    scheduler.add_job(
        _run_news_fetch,
        trigger=IntervalTrigger(hours=6),
        id="news_fetch",
        name="Fetch news from RSS feeds",
        replace_existing=True,
    )

    # Add news fetch job - also run at 6:00 AM daily
    scheduler.add_job(
        _run_news_fetch,
        trigger=CronTrigger(hour=6, minute=0),
        id="news_fetch_morning",
        name="Morning news fetch",
        replace_existing=True,
    )

    # Add news cleanup job - runs daily at 3:00 AM
    scheduler.add_job(
        _run_news_cleanup,
        trigger=CronTrigger(hour=3, minute=0),
        id="news_cleanup",
        name="Cleanup old news articles",
        replace_existing=True,
    )

    # Add economy briefing email job - runs daily at 6:30 AM
    scheduler.add_job(
        _run_economy_briefing,
        trigger=CronTrigger(hour=6, minute=30),
        id="economy_briefing",
        name="Send economy briefing emails",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("Scheduler started with jobs: news_fetch (every 6h), news_cleanup (daily 3AM), economy_briefing (daily 6:30AM)")


def shutdown_scheduler():
    """Shutdown the scheduler."""
    global scheduler
    if scheduler and scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler shutdown")


async def run_job_now(job_id: str) -> dict:
    """Manually trigger a job to run immediately."""
    if job_id == "news_fetch":
        from app.tasks.news_fetcher import fetch_and_store_news
        return await fetch_and_store_news()
    elif job_id == "news_cleanup":
        from app.tasks.news_fetcher import cleanup_old_news
        await cleanup_old_news()
        return {"status": "completed"}
    elif job_id == "economy_briefing":
        from app.services.email import send_all_economy_briefings
        count = await send_all_economy_briefings()
        return {"status": "completed", "sent_count": count}
    else:
        raise ValueError(f"Unknown job: {job_id}")
