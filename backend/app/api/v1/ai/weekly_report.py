import uuid
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.ai_session import AISession
from app.models.weekly_report import WeeklyReport
from app.schemas.weekly_report import WeeklyReportCreate, WeeklyReportResponse
from app.graphs.weekly_report import run_weekly_report_graph

router = APIRouter()


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def create_weekly_report(
    request: WeeklyReportCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Start weekly report generation."""
    # Create AI session
    session = AISession(
        user_id=current_user.id,
        ai_type="weekly_report",
        status="pending",
        input_data=request.model_dump(mode="json"),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    # Start background task
    background_tasks.add_task(
        run_weekly_report_graph,
        session_id=str(session.id),
        user_id=str(current_user.id),
        input_data=request.model_dump(mode="json"),
    )

    return {
        "session_id": session.id,
        "status": "processing",
        "message": "주간보고서 생성을 시작했습니다.",
        "estimated_time": 30
    }


@router.get("/{session_id}", response_model=WeeklyReportResponse)
async def get_weekly_report(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get weekly report result."""
    result = await db.execute(
        select(AISession).where(
            AISession.id == session_id,
            AISession.user_id == current_user.id,
            AISession.ai_type == "weekly_report"
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    if session.status == "processing":
        raise HTTPException(
            status_code=status.HTTP_202_ACCEPTED,
            detail="Report is still being generated"
        )

    if session.status == "failed":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=session.error_message or "Report generation failed"
        )

    # Get weekly report
    result = await db.execute(
        select(WeeklyReport).where(WeeklyReport.session_id == session.id)
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Weekly report not found"
        )

    return report
