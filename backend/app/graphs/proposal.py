"""Proposal (Deep Research) Generation LangGraph Workflow."""
import json
from typing import TypedDict, List, Optional
from datetime import datetime
from uuid import UUID

from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage

from app.services.llm import get_model
from app.core.database import async_session_maker
from app.models.ai_session import AISession
from app.models.proposal import Proposal
from sqlalchemy import select


class ProposalState(TypedDict):
    """State for proposal generation."""
    session_id: str
    user_id: str
    idea: str
    target_market: Optional[str]
    budget_range: Optional[str]
    special_requirements: Optional[str]

    # Research results
    research_plan: List[str]
    market_research: str
    legal_research: str
    tech_research: str

    # Generated content
    proposal_title: str
    proposal_content: str
    research_data: dict
    error: Optional[str]


async def create_research_plan(state: ProposalState) -> ProposalState:
    """Create a research plan for the proposal."""
    model = get_model("gpt-5-mini")

    prompt = f"""
    다음 아이디어에 대한 상세 기획서를 작성하기 위한 리서치 계획을 수립해주세요.

    ## 아이디어
    {state["idea"]}

    ## 타겟 시장
    {state.get("target_market") or "미정"}

    ## 예산 규모
    {state.get("budget_range") or "미정"}

    10-15개의 구체적인 리서치 질문을 생성해주세요.
    각 질문은 시장, 법률/규제, 기술 중 하나의 카테고리에 속해야 합니다.

    JSON 형식으로 출력:
    {{
        "title": "프로젝트 제목",
        "questions": [
            {{"category": "market", "question": "질문1"}},
            {{"category": "legal", "question": "질문2"}},
            {{"category": "tech", "question": "질문3"}}
        ]
    }}
    """

    response = await model.ainvoke([HumanMessage(content=prompt)])

    try:
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        plan = json.loads(content.strip())
        questions = [q["question"] for q in plan.get("questions", [])]
        title = plan.get("title", state["idea"][:50])
    except (json.JSONDecodeError, IndexError):
        questions = ["시장 규모", "경쟁사 분석", "관련 법률", "기술 트렌드"]
        title = state["idea"][:50]

    await update_progress(state["session_id"], {
        "current_phase": "planning",
        "research_topics": questions[:5],
        "message": "리서치 계획 수립 완료"
    })

    return {
        **state,
        "research_plan": questions,
        "proposal_title": title,
    }


async def conduct_market_research(state: ProposalState) -> ProposalState:
    """Conduct market research."""
    model = get_model("gpt-5")

    await update_progress(state["session_id"], {
        "current_phase": "market_research",
        "message": "시장 조사 진행 중..."
    })

    market_questions = [q for q in state["research_plan"] if "시장" in q or "경쟁" in q or "고객" in q]

    prompt = f"""
    다음 아이디어에 대한 시장 조사를 수행해주세요.

    ## 아이디어
    {state["idea"]}

    ## 조사 항목
    {json.dumps(market_questions, ensure_ascii=False)}

    다음 내용을 포함해주세요:
    1. 시장 규모 및 성장성
    2. 타겟 고객 정의
    3. 경쟁사 분석 (3-5개)
    4. 시장 기회와 위협

    상세하게 마크다운 형식으로 작성해주세요.
    """

    response = await model.ainvoke([HumanMessage(content=prompt)])

    return {
        **state,
        "market_research": response.content,
    }


async def conduct_legal_research(state: ProposalState) -> ProposalState:
    """Conduct legal/regulatory research."""
    model = get_model("gpt-5")

    await update_progress(state["session_id"], {
        "current_phase": "legal_research",
        "message": "법률/규제 조사 진행 중..."
    })

    prompt = f"""
    다음 아이디어와 관련된 법률 및 규제를 조사해주세요.

    ## 아이디어
    {state["idea"]}

    다음 내용을 포함해주세요:
    1. 관련 법령 (한국 기준)
    2. 인허가 요건
    3. 개인정보보호 관련 사항
    4. 컴플라이언스 체크리스트

    상세하게 마크다운 형식으로 작성해주세요.
    """

    response = await model.ainvoke([HumanMessage(content=prompt)])

    return {
        **state,
        "legal_research": response.content,
    }


async def conduct_tech_research(state: ProposalState) -> ProposalState:
    """Conduct technology research."""
    model = get_model("gpt-5")

    await update_progress(state["session_id"], {
        "current_phase": "tech_research",
        "message": "기술 조사 진행 중..."
    })

    prompt = f"""
    다음 아이디어를 구현하기 위한 기술 조사를 수행해주세요.

    ## 아이디어
    {state["idea"]}

    다음 내용을 포함해주세요:
    1. 최신 기술 트렌드
    2. 추천 기술 스택
    3. 오픈소스 활용 방안
    4. 기술적 도전과제

    상세하게 마크다운 형식으로 작성해주세요.
    """

    response = await model.ainvoke([HumanMessage(content=prompt)])

    return {
        **state,
        "tech_research": response.content,
    }


async def write_proposal(state: ProposalState) -> ProposalState:
    """Write the final proposal."""
    model = get_model("claude-opus-4.5")

    await update_progress(state["session_id"], {
        "current_phase": "writing",
        "message": "기획서 작성 중..."
    })

    prompt = f"""
    다음 리서치 결과를 바탕으로 완전한 기획서를 작성해주세요.

    ## 아이디어
    {state["idea"]}

    ## 시장 조사 결과
    {state["market_research"]}

    ## 법률/규제 조사 결과
    {state["legal_research"]}

    ## 기술 조사 결과
    {state["tech_research"]}

    ## 추가 요구사항
    {state.get("special_requirements") or "없음"}

    다음 목차로 기획서를 작성해주세요:

    1. Executive Summary
    2. 시장 분석
       2.1 시장 규모 및 성장성
       2.2 타겟 고객 정의
       2.3 경쟁사 분석
       2.4 시장 기회
    3. 법률 및 규제
       3.1 관련 법령
       3.2 인허가 요건
       3.3 개인정보보호
       3.4 컴플라이언스 체크리스트
    4. 제품 정의
       4.1 핵심 가치 제안
       4.2 기능 요구사항
       4.3 비기능 요구사항
       4.4 사용자 시나리오
    5. 기술 설계
       5.1 기술 스택
       5.2 시스템 아키텍처
       5.3 데이터베이스 설계
       5.4 API 설계
       5.5 보안 설계
    6. MVP 계획
       6.1 MVP 기능 범위
       6.2 마일스톤
       6.3 리소스 요구사항
    7. 리스크 분석

    마크다운 형식으로 상세하게 작성해주세요.
    """

    response = await model.ainvoke([HumanMessage(content=prompt)])

    return {
        **state,
        "proposal_content": response.content,
        "research_data": {
            "market": state["market_research"][:1000],
            "legal": state["legal_research"][:1000],
            "tech": state["tech_research"][:1000],
        }
    }


async def save_proposal(state: ProposalState) -> ProposalState:
    """Save the proposal."""
    async with async_session_maker() as db:
        result = await db.execute(
            select(AISession).where(AISession.id == UUID(state["session_id"]))
        )
        session = result.scalar_one_or_none()

        if session:
            session.status = "completed"
            session.completed_at = datetime.utcnow()
            session.output_data = {"title": state["proposal_title"]}

            proposal = Proposal(
                session_id=session.id,
                title=state["proposal_title"],
                content=state["proposal_content"],
                research_data=state["research_data"],
            )
            db.add(proposal)
            await db.commit()

    return state


async def update_progress(session_id: str, progress: dict):
    """Update session progress."""
    async with async_session_maker() as db:
        result = await db.execute(
            select(AISession).where(AISession.id == UUID(session_id))
        )
        session = result.scalar_one_or_none()
        if session:
            session.status = "processing"
            current = session.output_data or {}
            current["progress"] = progress
            session.output_data = current
            await db.commit()


def create_proposal_graph():
    """Create the proposal generation graph."""
    workflow = StateGraph(ProposalState)

    workflow.add_node("create_research_plan", create_research_plan)
    workflow.add_node("conduct_market_research", conduct_market_research)
    workflow.add_node("conduct_legal_research", conduct_legal_research)
    workflow.add_node("conduct_tech_research", conduct_tech_research)
    workflow.add_node("write_proposal", write_proposal)
    workflow.add_node("save_proposal", save_proposal)

    workflow.set_entry_point("create_research_plan")
    workflow.add_edge("create_research_plan", "conduct_market_research")
    workflow.add_edge("conduct_market_research", "conduct_legal_research")
    workflow.add_edge("conduct_legal_research", "conduct_tech_research")
    workflow.add_edge("conduct_tech_research", "write_proposal")
    workflow.add_edge("write_proposal", "save_proposal")
    workflow.add_edge("save_proposal", END)

    return workflow.compile()


async def run_proposal_graph(
    session_id: str,
    user_id: str,
    input_data: dict
):
    """Run the proposal generation graph."""
    try:
        graph = create_proposal_graph()

        initial_state = ProposalState(
            session_id=session_id,
            user_id=user_id,
            idea=input_data["idea"],
            target_market=input_data.get("target_market"),
            budget_range=input_data.get("budget_range"),
            special_requirements=input_data.get("special_requirements"),
            research_plan=[],
            market_research="",
            legal_research="",
            tech_research="",
            proposal_title="",
            proposal_content="",
            research_data={},
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
