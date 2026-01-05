import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class AISession(Base):
    __tablename__ = "ai_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    ai_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )  # cover_letter, weekly_report, proposal, translate, economy, travel
    status: Mapped[str] = mapped_column(
        String(20),
        default="pending"
    )  # pending, processing, completed, failed
    input_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    output_data: Mapped[dict] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="ai_sessions")
    cover_letter = relationship("CoverLetter", back_populates="session", uselist=False)
    weekly_report = relationship("WeeklyReport", back_populates="session", uselist=False)
    proposal = relationship("Proposal", back_populates="session", uselist=False)
    translation = relationship("Translation", back_populates="session", uselist=False)
    travel_plan = relationship("TravelPlan", back_populates="session", uselist=False)

    def __repr__(self):
        return f"<AISession {self.ai_type} - {self.status}>"
