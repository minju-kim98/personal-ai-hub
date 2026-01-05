from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class NewsArticleResponse(BaseModel):
    id: UUID
    title: str
    url: str
    source: Optional[str] = None
    category: Optional[str] = None
    summary: Optional[str] = None
    sentiment: Optional[str] = None
    published_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NewsListResponse(BaseModel):
    items: List[NewsArticleResponse]
    total: int
    page: int
    size: int


class UserStockCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    name: Optional[str] = Field(None, max_length=100)


class UserStockResponse(BaseModel):
    id: UUID
    user_id: UUID
    symbol: str
    name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    amount: Decimal = Field(..., gt=0)
    category: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    expense_date: date


class ExpenseResponse(BaseModel):
    id: UUID
    user_id: UUID
    amount: Decimal
    category: Optional[str] = None
    description: Optional[str] = None
    expense_date: date
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseListResponse(BaseModel):
    items: List[ExpenseResponse]
    total: int
    total_amount: Decimal


class EconomySettings(BaseModel):
    email_enabled: bool = True
    email_time: str = "06:30"
    news_categories: List[str] = ["ai", "cloud", "security", "startup"]
    watchlist_stocks: List[str] = []
    google_sheet_url: Optional[str] = None
