import uuid
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.ai_session import AISession
from app.models.travel import TravelPlan
from app.schemas.travel import TravelPlanCreate, TravelPlanResponse
from app.graphs.travel import run_travel_graph

router = APIRouter()


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def create_travel_plan(
    request: TravelPlanCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Start travel/date course planning."""
    # Create AI session
    session = AISession(
        user_id=current_user.id,
        ai_type="travel",
        status="pending",
        input_data=request.model_dump(mode="json"),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    # Start background task
    background_tasks.add_task(
        run_travel_graph,
        session_id=str(session.id),
        user_id=str(current_user.id),
        input_data=request.model_dump(mode="json"),
    )

    travel_type_kr = "여행" if request.travel_type == "travel" else "데이트"

    return {
        "session_id": session.id,
        "status": "processing",
        "message": f"{travel_type_kr} 코스 생성을 시작했습니다.",
        "estimated_time": 60
    }


@router.get("/{session_id}", response_model=TravelPlanResponse)
async def get_travel_plan(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get travel plan result."""
    result = await db.execute(
        select(AISession).where(
            AISession.id == session_id,
            AISession.user_id == current_user.id,
            AISession.ai_type == "travel"
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    if session.status == "processing" or session.status == "pending":
        raise HTTPException(
            status_code=status.HTTP_202_ACCEPTED,
            detail="Travel plan is still being generated"
        )

    if session.status == "failed":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=session.error_message or "Travel plan generation failed"
        )

    # Get travel plan
    result = await db.execute(
        select(TravelPlan).where(TravelPlan.session_id == session.id)
    )
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Travel plan not found"
        )

    return plan
