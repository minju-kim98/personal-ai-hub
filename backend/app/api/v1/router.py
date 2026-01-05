from fastapi import APIRouter
from app.api.v1 import auth, users, documents
from app.api.v1.ai import (
    cover_letter,
    weekly_report,
    proposal,
    translate,
    economy,
    travel,
)

api_router = APIRouter()

# Auth routes
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# User routes
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Document routes
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])

# AI routes
api_router.include_router(
    cover_letter.router,
    prefix="/ai/cover-letter",
    tags=["ai", "cover-letter"]
)
api_router.include_router(
    weekly_report.router,
    prefix="/ai/weekly-report",
    tags=["ai", "weekly-report"]
)
api_router.include_router(
    proposal.router,
    prefix="/ai/proposal",
    tags=["ai", "proposal"]
)
api_router.include_router(
    translate.router,
    prefix="/ai/translate",
    tags=["ai", "translate"]
)
api_router.include_router(
    economy.router,
    prefix="/economy",
    tags=["economy"]
)
api_router.include_router(
    travel.router,
    prefix="/ai/travel",
    tags=["ai", "travel"]
)
