from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class DocumentBase(BaseModel):
    category: str = Field(..., pattern="^(resume|portfolio|cover_letter|weekly_report|proposal|misc)$")
    title: str = Field(..., min_length=1, max_length=255)


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    category: Optional[str] = Field(None, pattern="^(resume|portfolio|cover_letter|weekly_report|proposal|misc)$")
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    is_archived: Optional[bool] = None


class DocumentResponse(DocumentBase):
    id: UUID
    user_id: UUID
    original_file_name: str
    original_file_type: str
    original_file_url: str
    markdown_content: Optional[str] = None
    markdown_file_url: Optional[str] = None
    keywords: List[str] = []
    summary: Optional[str] = None
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    items: List[DocumentResponse]
    total: int
    page: int
    size: int
