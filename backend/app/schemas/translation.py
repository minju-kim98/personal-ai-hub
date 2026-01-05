from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class TranslationCreate(BaseModel):
    translation_type: str = Field(..., pattern="^(srt|text|email)$")
    source_language: str = Field(default="auto")
    target_language: str = Field(..., min_length=2)
    content: str = Field(..., min_length=1)
    context: Optional[str] = None  # 상황 설명 (이메일 작성 시)


class TranslationResponse(BaseModel):
    id: UUID
    session_id: UUID
    source_language: str
    target_language: str
    translation_type: str
    original_content: str
    translated_content: str
    created_at: datetime

    class Config:
        from_attributes = True


class SRTTranslationCreate(BaseModel):
    target_language: str = Field(..., min_length=2)
    # File will be uploaded separately


class EmailWriteCreate(BaseModel):
    target_language: str = Field(..., min_length=2)
    context: str = Field(..., min_length=1)  # 상황 설명
    key_points: str = Field(..., min_length=1)  # 핵심 내용
