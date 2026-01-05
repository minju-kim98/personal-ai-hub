"""Weekly Report Generation LangGraph Workflow."""
import json
from typing import TypedDict, List, Optional
from datetime import datetime, date, timedelta
from uuid import UUID

from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage

from app.services.llm import get_model
from app.core.database import async_session_maker
from app.models.ai_session import AISession
from app.models.weekly_report import WeeklyReport
from app.models.document import Document
from sqlalchemy import select


class WeeklyReportState(TypedDict):
    """State for weekly report generation."""
    session_id: str
    user_id: str
    tasks_completed: str
    next_week_plan: Optional[str]
    boss_preferences: Optional[str]
    reference_document_ids: List[str]

    # Reference content
    reference_style: str

    # Generated
    report_content: str
    error: Optional[str]


async def analyze_style(state: WeeklyReportState) -> WeeklyReportState:
    """Analyze existing report style."""
    async with async_session_maker() as db:
        # Get user's weekly reports
        result = await db.execute(
            select(Document).where(
                Document.user_id == UUID(state["user_id"]),
                Document.category == "weekly_report",
                Document.is_archived == False
            ).order_by(Document.created_at.desc()).limit(3)
        )
        documents = result.scalars().all()

        if documents and documents[0].markdown_content:
            reference_style = documents[0].markdown_content[:2000]
        else:
            reference_style = ""

        return {
            **state,
            "reference_style": reference_style,
        }


async def generate_report(state: WeeklyReportState) -> WeeklyReportState:
    """Generate the weekly report."""
    model = get_model("gpt-5-mini")

    # Calculate week dates
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=4)

    style_reference = f"""
    ## 기존 보고서 스타일 참고
    {state["reference_style"]}
    """ if state["reference_style"] else ""

    boss_pref = f"""
    ## 상사 성향/특이사항
    {state["boss_preferences"]}
    """ if state.get("boss_preferences") else ""

    prompt = f"""
    주간업무보고서를 작성해주세요.

    ## 기간
    {week_start.strftime("%Y.%m.%d")} ~ {week_end.strftime("%Y.%m.%d")}

    ## 이번 주 수행 업무
    {state["tasks_completed"]}

    ## 다음 주 계획
    {state.get("next_week_plan") or "미정"}

    {style_reference}

    {boss_pref}

    ## 요구사항
    1. PPT에 바로 복사할 수 있도록 구조화된 마크다운 형식으로 작성
    2. 표와 불릿 포인트 활용
    3. 진행률(%)이 있다면 포함
    4. 이슈가 있다면 이슈 및 해결방안 섹션 추가
    5. 간결하고 핵심만 작성

    마크다운 형식으로 보고서를 작성해주세요.
    """

    response = await model.ainvoke([HumanMessage(content=prompt)])

    return {
        **state,
        "report_content": response.content,
    }


async def save_report(state: WeeklyReportState) -> WeeklyReportState:
    """Save the weekly report."""
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=4)

    async with async_session_maker() as db:
        result = await db.execute(
            select(AISession).where(AISession.id == UUID(state["session_id"]))
        )
        session = result.scalar_one_or_none()

        if session:
            session.status = "completed"
            session.completed_at = datetime.utcnow()
            session.output_data = {"report_preview": state["report_content"][:500]}

            report = WeeklyReport(
                session_id=session.id,
                week_start=week_start,
                week_end=week_end,
                content=state["report_content"],
            )
            db.add(report)
            await db.commit()

    return state


def create_weekly_report_graph():
    """Create the weekly report generation graph."""
    workflow = StateGraph(WeeklyReportState)

    workflow.add_node("analyze_style", analyze_style)
    workflow.add_node("generate_report", generate_report)
    workflow.add_node("save_report", save_report)

    workflow.set_entry_point("analyze_style")
    workflow.add_edge("analyze_style", "generate_report")
    workflow.add_edge("generate_report", "save_report")
    workflow.add_edge("save_report", END)

    return workflow.compile()


async def run_weekly_report_graph(
    session_id: str,
    user_id: str,
    input_data: dict
):
    """Run the weekly report generation graph."""
    try:
        async with async_session_maker() as db:
            result = await db.execute(
                select(AISession).where(AISession.id == UUID(session_id))
            )
            session = result.scalar_one_or_none()
            if session:
                session.status = "processing"
                await db.commit()

        graph = create_weekly_report_graph()

        initial_state = WeeklyReportState(
            session_id=session_id,
            user_id=user_id,
            tasks_completed=input_data["tasks_completed"],
            next_week_plan=input_data.get("next_week_plan"),
            boss_preferences=input_data.get("boss_preferences"),
            reference_document_ids=input_data.get("reference_document_ids", []),
            reference_style="",
            report_content="",
            error=None,
        )

        await graph.ainvoke(initial_state)

    except Exception as e:
        async with async_session_maker() as db:
            result = await db.execute(
                select(AISession).where(AISession.id == UUID(session_id))
            )
            session = result.scalar_one_or_none()
            if session:
                session.status = "failed"
                session.error_message = str(e)
                await db.commit()
