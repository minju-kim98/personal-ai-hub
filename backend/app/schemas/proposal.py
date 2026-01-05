from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class ProposalCreate(BaseModel):
    idea: str = Field(..., min_length=10)
    target_market: Optional[str] = None
    budget_range: Optional[str] = None
    special_requirements: Optional[str] = None


class ProposalResponse(BaseModel):
    id: UUID
    session_id: UUID
    title: str
    content: str
    research_data: dict
    created_at: datetime

    class Config:
        from_attributes = True


class ProposalProgress(BaseModel):
    session_id: UUID
    status: str
    current_phase: Optional[str] = None
    research_topics: Optional[list] = None
    message: Optional[str] = None
