from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class TravelPlanCreate(BaseModel):
    travel_type: str = Field(..., pattern="^(travel|date)$")
    start_date: date
    end_date: date
    departure: str = Field(..., min_length=1)
    destination: str = Field(..., min_length=1)
    interests: List[str] = []  # food, cafe, nature, culture, shopping, etc.
    budget_range: Optional[str] = None  # low, medium, high
    companions: Optional[str] = None  # alone, couple, friends, family
    special_requests: Optional[str] = None


class TravelPlanResponse(BaseModel):
    id: UUID
    session_id: UUID
    title: str
    start_date: date
    end_date: date
    content: dict  # Full plan with timeline, budget, checklist
    created_at: datetime

    class Config:
        from_attributes = True


class TravelPlanContent(BaseModel):
    timeline: List[dict]  # Day-by-day schedule
    places: List[dict]  # Recommended places
    route: dict  # Optimized route info
    budget: dict  # Budget breakdown
    checklist: List[str]  # Packing list
    booking_links: List[dict]  # Reservation links
