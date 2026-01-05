from datetime import datetime
from typing import Optional, Any
from uuid import UUID
from pydantic import BaseModel


class AISessionCreate(BaseModel):
    ai_type: str
    input_data: dict


class AISessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    ai_type: str
    status: str
    input_data: dict
    output_data: Optional[dict] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AISessionProgress(BaseModel):
    session_id: UUID
    status: str
    progress: Optional[dict] = None
    message: Optional[str] = None
