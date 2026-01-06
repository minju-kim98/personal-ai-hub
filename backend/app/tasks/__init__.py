"""Background tasks for Personal AI Hub."""
from app.tasks.scheduler import start_scheduler, shutdown_scheduler
from app.tasks.news_fetcher import fetch_and_store_news

__all__ = ["start_scheduler", "shutdown_scheduler", "fetch_and_store_news"]
