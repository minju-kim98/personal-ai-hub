from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserLogin
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentResponse
from app.schemas.ai_session import AISessionCreate, AISessionResponse
from app.schemas.cover_letter import CoverLetterCreate, CoverLetterResponse
from app.schemas.weekly_report import WeeklyReportCreate, WeeklyReportResponse
from app.schemas.proposal import ProposalCreate, ProposalResponse
from app.schemas.translation import TranslationCreate, TranslationResponse
from app.schemas.economy import (
    NewsArticleResponse,
    UserStockCreate,
    UserStockResponse,
    ExpenseCreate,
    ExpenseResponse,
)
from app.schemas.travel import TravelPlanCreate, TravelPlanResponse

__all__ = [
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserLogin",
    "DocumentCreate",
    "DocumentUpdate",
    "DocumentResponse",
    "AISessionCreate",
    "AISessionResponse",
    "CoverLetterCreate",
    "CoverLetterResponse",
    "WeeklyReportCreate",
    "WeeklyReportResponse",
    "ProposalCreate",
    "ProposalResponse",
    "TranslationCreate",
    "TranslationResponse",
    "NewsArticleResponse",
    "UserStockCreate",
    "UserStockResponse",
    "ExpenseCreate",
    "ExpenseResponse",
    "TravelPlanCreate",
    "TravelPlanResponse",
]
