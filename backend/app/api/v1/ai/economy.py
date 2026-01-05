import uuid
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.economy import NewsArticle, UserStock, Expense
from app.schemas.economy import (
    NewsArticleResponse,
    NewsListResponse,
    UserStockCreate,
    UserStockResponse,
    ExpenseCreate,
    ExpenseResponse,
    ExpenseListResponse,
    EconomySettings,
)

router = APIRouter()


# ===== News Routes =====

@router.get("/news", response_model=NewsListResponse)
async def list_news(
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List news articles."""
    query = select(NewsArticle)

    if category:
        query = query.where(NewsArticle.category == category)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Paginate
    query = query.order_by(NewsArticle.published_at.desc())
    query = query.offset((page - 1) * size).limit(size)

    result = await db.execute(query)
    articles = result.scalars().all()

    return NewsListResponse(
        items=articles,
        total=total,
        page=page,
        size=size
    )


@router.get("/news/{article_id}", response_model=NewsArticleResponse)
async def get_news_article(
    article_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific news article."""
    result = await db.execute(
        select(NewsArticle).where(NewsArticle.id == article_id)
    )
    article = result.scalar_one_or_none()

    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )

    return article


# ===== Stock Routes =====

@router.get("/stocks", response_model=List[UserStockResponse])
async def list_user_stocks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List user's watchlist stocks."""
    result = await db.execute(
        select(UserStock).where(UserStock.user_id == current_user.id)
    )
    stocks = result.scalars().all()
    return stocks


@router.post("/stocks", response_model=UserStockResponse, status_code=status.HTTP_201_CREATED)
async def add_stock(
    stock: UserStockCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a stock to watchlist."""
    # Check if already exists
    result = await db.execute(
        select(UserStock).where(
            UserStock.user_id == current_user.id,
            UserStock.symbol == stock.symbol.upper()
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock already in watchlist"
        )

    user_stock = UserStock(
        user_id=current_user.id,
        symbol=stock.symbol.upper(),
        name=stock.name,
    )
    db.add(user_stock)
    await db.commit()
    await db.refresh(user_stock)

    return user_stock


@router.delete("/stocks/{symbol}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_stock(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove a stock from watchlist."""
    result = await db.execute(
        select(UserStock).where(
            UserStock.user_id == current_user.id,
            UserStock.symbol == symbol.upper()
        )
    )
    stock = result.scalar_one_or_none()

    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock not found in watchlist"
        )

    await db.delete(stock)
    await db.commit()


# ===== Expense Routes =====

@router.get("/expenses", response_model=ExpenseListResponse)
async def list_expenses(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List user's expenses."""
    query = select(Expense).where(Expense.user_id == current_user.id)

    if start_date:
        query = query.where(Expense.expense_date >= start_date)
    if end_date:
        query = query.where(Expense.expense_date <= end_date)
    if category:
        query = query.where(Expense.category == category)

    query = query.order_by(Expense.expense_date.desc())

    result = await db.execute(query)
    expenses = result.scalars().all()

    total_amount = sum(e.amount for e in expenses)

    return ExpenseListResponse(
        items=expenses,
        total=len(expenses),
        total_amount=total_amount
    )


@router.post("/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def add_expense(
    expense: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add an expense."""
    new_expense = Expense(
        user_id=current_user.id,
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        expense_date=expense.expense_date,
    )
    db.add(new_expense)
    await db.commit()
    await db.refresh(new_expense)

    return new_expense


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an expense."""
    result = await db.execute(
        select(Expense).where(
            Expense.id == expense_id,
            Expense.user_id == current_user.id
        )
    )
    expense = result.scalar_one_or_none()

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )

    await db.delete(expense)
    await db.commit()


# ===== Settings Routes =====

@router.get("/settings", response_model=EconomySettings)
async def get_economy_settings(
    current_user: User = Depends(get_current_user),
):
    """Get user's economy settings."""
    settings = current_user.settings.get("economy", {})
    return EconomySettings(**settings)


@router.patch("/settings", response_model=EconomySettings)
async def update_economy_settings(
    settings: EconomySettings,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user's economy settings."""
    current_settings = current_user.settings or {}
    current_settings["economy"] = settings.model_dump()
    current_user.settings = current_settings

    await db.commit()
    await db.refresh(current_user)

    return settings
