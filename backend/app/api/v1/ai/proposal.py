import uuid
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.ai_session import AISession
from app.models.proposal import Proposal
from app.schemas.proposal import ProposalCreate, ProposalResponse, ProposalProgress
from app.graphs.proposal import run_proposal_graph

router = APIRouter()


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def create_proposal(
    request: ProposalCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Start proposal (deep research) generation."""
    # Create AI session
    session = AISession(
        user_id=current_user.id,
        ai_type="proposal",
        status="pending",
        input_data=request.model_dump(mode="json"),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    # Start background task
    background_tasks.add_task(
        run_proposal_graph,
        session_id=str(session.id),
        user_id=str(current_user.id),
        input_data=request.model_dump(mode="json"),
    )

    return {
        "session_id": session.id,
        "status": "processing",
        "message": "기획서 생성을 시작했습니다. Deep Research가 진행됩니다.",
        "estimated_time": 300
    }


@router.get("/{session_id}", response_model=ProposalProgress)
async def get_proposal_status(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get proposal generation status."""
    result = await db.execute(
        select(AISession).where(
            AISession.id == session_id,
            AISession.user_id == current_user.id,
            AISession.ai_type == "proposal"
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    progress = session.output_data.get("progress", {}) if session.output_data else {}

    return ProposalProgress(
        session_id=session.id,
        status=session.status,
        current_phase=progress.get("current_phase"),
        research_topics=progress.get("research_topics"),
        message=progress.get("message"),
    )


@router.get("/{session_id}/result", response_model=ProposalResponse)
async def get_proposal_result(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get proposal generation result."""
    result = await db.execute(
        select(AISession).where(
            AISession.id == session_id,
            AISession.user_id == current_user.id,
            AISession.ai_type == "proposal"
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

    # Get proposal
    result = await db.execute(
        select(Proposal).where(Proposal.session_id == session.id)
    )
    proposal = result.scalar_one_or_none()

    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )

    return proposal
