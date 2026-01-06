"""Personal AI Hub - FastAPI Application."""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger

from app.core.config import settings
from app.core.database import init_db
from app.api.v1.router import api_router
from app.tasks.scheduler import start_scheduler, shutdown_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    # Create upload directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # Initialize database (create tables if not exist)
    await init_db()

    # Start background scheduler
    start_scheduler()
    logger.info("Background scheduler started")

    yield

    # Shutdown
    shutdown_scheduler()
    logger.info("Background scheduler stopped")


app = FastAPI(
    title=settings.APP_NAME,
    description="나만을 위한 AI가 모여있는 개인 AI 플랫폼",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",
        "https://personal-ai-hub-mu.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "app": settings.APP_NAME}


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Personal AI Hub API",
        "docs": "/docs" if settings.DEBUG else "Disabled in production",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
