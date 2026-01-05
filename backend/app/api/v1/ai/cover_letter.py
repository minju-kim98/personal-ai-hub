import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.ai_session import AISession
from app.models.cover_letter import CoverLetter
from app.schemas.cover_letter import (
    CoverLetterCreate,
    CoverLetterResponse,
    CoverLetterProgress,
)
from app.graphs.cover_letter import run_cover_letter_graph

router = APIRouter()


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def create_cover_letter(
    request: CoverLetterCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Start cover letter generation."""
    # Create AI session
    session = AISession(
        user_id=current_user.id,
        ai_type="cover_letter",
        status="pending",
        input_data=request.model_dump(mode="json"),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    # Start background task
    background_tasks.add_task(
        run_cover_letter_graph,
        session_id=str(session.id),
        user_id=str(current_user.id),
        input_data=request.model_dump(mode="json"),
    )

    return {
        "session_id": session.id,
        "status": "processing",
        "message": "자기소개서 생성을 시작했습니다.",
        "estimated_time": 120
    }


@router.get("/{session_id}", response_model=CoverLetterProgress)
async def get_cover_letter_status(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get cover letter generation status."""
    result = await db.execute(
        select(AISession).where(
            AISession.id == session_id,
            AISession.user_id == current_user.id,
            AISession.ai_type == "cover_letter"
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    progress = session.output_data.get("progress", {}) if session.output_data else {}

    return CoverLetterProgress(
        session_id=session.id,
        status=session.status,
        current_step=progress.get("current_step"),
        iteration=progress.get("iteration"),
        score=progress.get("score"),
        message=progress.get("message"),
    )


@router.get("/{session_id}/result", response_model=CoverLetterResponse)
async def get_cover_letter_result(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get cover letter generation result."""
    result = await db.execute(
        select(AISession).where(
            AISession.id == session_id,
            AISession.user_id == current_user.id,
            AISession.ai_type == "cover_letter"
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    if session.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Session is not completed. Current status: {session.status}"
        )

    # Get cover letter
    result = await db.execute(
        select(CoverLetter).where(CoverLetter.session_id == session.id)
    )
    cover_letter = result.scalar_one_or_none()

    if not cover_letter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cover letter not found"
        )

    return cover_letter
