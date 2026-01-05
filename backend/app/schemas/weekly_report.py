from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class WeeklyReportCreate(BaseModel):
    tasks_completed: str = Field(..., min_length=1)
    next_week_plan: Optional[str] = None
    boss_preferences: Optional[str] = None
    reference_document_ids: List[UUID] = []


class WeeklyReportResponse(BaseModel):
    id: UUID
    session_id: UUID
    week_start: date
    week_end: date
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
