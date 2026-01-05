from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class CoverLetterCreate(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=255)
    job_posting: str = Field(..., min_length=1)
    document_ids: List[UUID] = []
    additional_instructions: Optional[str] = None


class CoverLetterResponse(BaseModel):
    id: UUID
    session_id: UUID
    company_name: str
    job_posting: str
    content: dict
    final_score: Optional[float] = None
    iteration_count: int
    revision_history: list
    created_at: datetime

    class Config:
        from_attributes = True


class CoverLetterProgress(BaseModel):
    session_id: UUID
    status: str
    current_step: Optional[str] = None
    iteration: Optional[int] = None
    score: Optional[float] = None
    message: Optional[str] = None
