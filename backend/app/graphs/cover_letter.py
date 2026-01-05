"""Cover Letter Generation LangGraph Workflow."""
import json
from typing import TypedDict, List, Optional, Annotated
from datetime import datetime
from uuid import UUID

from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage

from app.services.llm import get_model
from app.core.database import async_session_maker
from app.models.ai_session import AISession
from app.models.cover_letter import CoverLetter
from app.models.document import Document
from sqlalchemy import select


class CoverLetterState(TypedDict):
    """State for cover letter generation."""
    # Input
    session_id: str
    user_id: str
    company_name: str
    job_posting: str
    document_ids: List[str]
    additional_instructions: Optional[str]

    # Document content
    resume_content: str
    portfolio_content: str
    existing_cover_letters: List[str]

    # Research results
    company_research: str
    job_requirements: dict

    # Generation
    current_cover_letter: dict
    comparison_score: float
    feedback: str
    iteration_count: int

    # Final
    final_cover_letter: dict
    final_score: float
    error: Optional[str]


async def collect_documents(state: CoverLetterState) -> CoverLetterState:
    """Collect documents from database."""
    async with async_session_maker() as db:
        # Get user's documents
        result = await db.execute(
            select(Document).where(
                Document.user_id == UUID(state["user_id"]),
                Document.is_archived == False
            )
        )
        documents = result.scalars().all()

        resume_content = ""
        portfolio_content = ""
        existing_cover_letters = []

        for doc in documents:
            if doc.category == "resume" and doc.markdown_content:
                resume_content = doc.markdown_content
            elif doc.category == "portfolio" and doc.markdown_content:
                portfolio_content = doc.markdown_content
            elif doc.category == "cover_letter" and doc.markdown_content:
                existing_cover_letters.append(doc.markdown_content)

        return {
            **state,
            "resume_content": resume_content,
            "portfolio_content": portfolio_content,
            "existing_cover_letters": existing_cover_letters[:3],  # Limit to 3
        }


async def research_company(state: CoverLetterState) -> CoverLetterState:
    """Research company information."""
    model = get_model("gpt-5-mini")

    prompt = f"""
    다음 회사에 대해 조사해주세요: {state["company_name"]}

    조사 항목:
    1. 회사 비전과 미션
    2. 핵심 가치와 문화
    3. 주요 사업 영역
    4. 최근 뉴스 및 동향

    간결하게 핵심만 정리해주세요.
    """

    response = await model.ainvoke([HumanMessage(content=prompt)])

    return {
        **state,
        "company_research": response.content,
    }


async def analyze_job_posting(state: CoverLetterState) -> CoverLetterState:
    """Analyze job posting requirements."""
    model = get_model("gpt-5-mini")

    prompt = f"""
    다음 채용 공고를 분석하여 JSON 형식으로 정리해주세요:

    {state["job_posting"]}

    출력 형식 (JSON만 출력):
    {{
        "position": "직무명",
        "requirements": ["필수 요건1", "필수 요건2"],
        "preferred": ["우대 사항1", "우대 사항2"],
        "questions": ["자소서 문항1", "자소서 문항2"],
        "keywords": ["핵심 키워드1", "핵심 키워드2"]
    }}
    """

    response = await model.ainvoke([HumanMessage(content=prompt)])

    try:
        # Extract JSON from response
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        requirements = json.loads(content.strip())
    except (json.JSONDecodeError, IndexError):
        requirements = {
            "position": "지원 직무",
            "requirements": [],
            "preferred": [],
            "questions": ["자기소개", "지원동기", "입사 후 포부"],
            "keywords": []
        }

    return {
        **state,
        "job_requirements": requirements,
    }


async def generate_draft(state: CoverLetterState) -> CoverLetterState:
    """Generate cover letter draft."""
    model = get_model("claude-sonnet-4.5")

    existing_letters = "\n\n---\n\n".join(state["existing_cover_letters"][:2])

    prompt = f"""
    당신은 전문 이력서 작성 컨설턴트입니다.

    ## 지원자 정보
    ### 이력서
    {state["resume_content"][:3000]}

    ### 포트폴리오
    {state["portfolio_content"][:2000]}

    ## 기존 자기소개서 (톤앤매너 참고)
    {existing_letters[:2000]}

    ## 회사 정보
    {state["company_research"]}

    ## 채용 공고 분석
    {json.dumps(state["job_requirements"], ensure_ascii=False, indent=2)}

    ## 추가 지시사항
    {state.get("additional_instructions") or "없음"}

    ## 작성 요청
    위 정보를 바탕으로 각 자소서 문항에 대한 답변을 작성해주세요.
    기존 자소서의 톤앤매너를 유지하면서, 회사와 직무에 맞게 작성해주세요.

    출력 형식 (JSON만 출력):
    {{
        "문항1 제목": "답변 내용...",
        "문항2 제목": "답변 내용..."
    }}
    """

    response = await model.ainvoke([HumanMessage(content=prompt)])

    try:
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        draft = json.loads(content.strip())
    except (json.JSONDecodeError, IndexError):
        # Fallback: treat entire response as content
        draft = {"자기소개서": response.content}

    return {
        **state,
        "current_cover_letter": draft,
        "iteration_count": state.get("iteration_count", 0) + 1,
    }


async def compare_identity(state: CoverLetterState) -> CoverLetterState:
    """Compare with existing cover letters for identity consistency."""
    model = get_model("claude-haiku-4.5")

    existing_letters = "\n\n---\n\n".join(state["existing_cover_letters"][:2])

    prompt = f"""
    두 자기소개서가 동일인물이 작성했는지 분석해주세요.

    ## 기존 자기소개서
    {existing_letters[:2000]}

    ## 새로 생성된 자기소개서
    {json.dumps(state["current_cover_letter"], ensure_ascii=False)}

    ## 분석 기준
    1. 문체 일관성 (어투, 문장 구조)
    2. 가치관 일관성
    3. 경험 연결성
    4. 어휘 사용 패턴
    5. 스토리텔링 방식

    출력 형식 (JSON만 출력):
    {{
        "similarity_score": 0-100 사이 숫자,
        "is_same_person": true 또는 false,
        "feedback": "구체적인 피드백 및 개선 제안"
    }}
    """

    response = await model.ainvoke([HumanMessage(content=prompt)])

    try:
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        analysis = json.loads(content.strip())
        score = float(analysis.get("similarity_score", 80))
        feedback = analysis.get("feedback", "")
    except (json.JSONDecodeError, IndexError, ValueError):
        score = 80.0
        feedback = "분석을 완료했습니다."

    # Update session progress
    await update_session_progress(
        state["session_id"],
        {
            "current_step": "comparing",
            "iteration": state["iteration_count"],
            "score": score,
            "message": f"동일인물 유사도: {score}%"
        }
    )

    return {
        **state,
        "comparison_score": score,
        "feedback": feedback,
    }


def should_continue(state: CoverLetterState) -> str:
    """Decide whether to continue revising or finalize."""
    if state["comparison_score"] >= 85:
        return "finalize"
    if state["iteration_count"] >= 10:
        return "finalize"
    if not state.get("existing_cover_letters"):
        return "finalize"  # No reference to compare
    return "revise"


async def revise_cover_letter(state: CoverLetterState) -> CoverLetterState:
    """Revise cover letter based on feedback."""
    model = get_model("claude-sonnet-4.5")

    prompt = f"""
    다음 피드백을 반영하여 자기소개서를 수정해주세요.

    ## 현재 자기소개서
    {json.dumps(state["current_cover_letter"], ensure_ascii=False)}

    ## 피드백
    {state["feedback"]}

    ## 기존 자기소개서 (참고)
    {state["existing_cover_letters"][0] if state["existing_cover_letters"] else "없음"}

    피드백을 반영하여 수정된 자기소개서를 JSON 형식으로 출력해주세요.
    """

    response = await model.ainvoke([HumanMessage(content=prompt)])

    try:
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        revised = json.loads(content.strip())
    except (json.JSONDecodeError, IndexError):
        revised = state["current_cover_letter"]

    return {
        **state,
        "current_cover_letter": revised,
        "iteration_count": state["iteration_count"] + 1,
    }


async def finalize(state: CoverLetterState) -> CoverLetterState:
    """Finalize and save the cover letter."""
    async with async_session_maker() as db:
        # Update session
        result = await db.execute(
            select(AISession).where(AISession.id == UUID(state["session_id"]))
        )
        session = result.scalar_one_or_none()

        if session:
            session.status = "completed"
            session.completed_at = datetime.utcnow()
            session.output_data = {
                "final_score": state["comparison_score"],
                "iterations": state["iteration_count"],
            }

            # Create cover letter record
            cover_letter = CoverLetter(
                session_id=session.id,
                company_name=state["company_name"],
                job_posting=state["job_posting"],
                content=state["current_cover_letter"],
                final_score=state["comparison_score"],
                iteration_count=state["iteration_count"],
                revision_history=[],
            )
            db.add(cover_letter)
            await db.commit()

    return {
        **state,
        "final_cover_letter": state["current_cover_letter"],
        "final_score": state["comparison_score"],
    }


async def update_session_progress(session_id: str, progress: dict):
    """Update session progress in database."""
    async with async_session_maker() as db:
        result = await db.execute(
            select(AISession).where(AISession.id == UUID(session_id))
        )
        session = result.scalar_one_or_none()

        if session:
            session.status = "processing"
            current_output = session.output_data or {}
            current_output["progress"] = progress
            session.output_data = current_output
            await db.commit()


def create_cover_letter_graph():
    """Create the cover letter generation graph."""
    workflow = StateGraph(CoverLetterState)

    # Add nodes
    workflow.add_node("collect_documents", collect_documents)
    workflow.add_node("research_company", research_company)
    workflow.add_node("analyze_job_posting", analyze_job_posting)
    workflow.add_node("generate_draft", generate_draft)
    workflow.add_node("compare_identity", compare_identity)
    workflow.add_node("revise_cover_letter", revise_cover_letter)
    workflow.add_node("finalize", finalize)

    # Set entry point
    workflow.set_entry_point("collect_documents")

    # Add edges
    workflow.add_edge("collect_documents", "research_company")
    workflow.add_edge("research_company", "analyze_job_posting")
    workflow.add_edge("analyze_job_posting", "generate_draft")
    workflow.add_edge("generate_draft", "compare_identity")

    # Conditional edges
    workflow.add_conditional_edges(
        "compare_identity",
        should_continue,
        {
            "revise": "revise_cover_letter",
            "finalize": "finalize"
        }
    )
    workflow.add_edge("revise_cover_letter", "compare_identity")
    workflow.add_edge("finalize", END)

    return workflow.compile()


async def run_cover_letter_graph(
    session_id: str,
    user_id: str,
    input_data: dict
):
    """Run the cover letter generation graph."""
    try:
        # Update session status
        await update_session_progress(session_id, {"current_step": "starting", "message": "시작 중..."})

        graph = create_cover_letter_graph()

        initial_state = CoverLetterState(
            session_id=session_id,
            user_id=user_id,
            company_name=input_data["company_name"],
            job_posting=input_data["job_posting"],
            document_ids=input_data.get("document_ids", []),
            additional_instructions=input_data.get("additional_instructions"),
            resume_content="",
            portfolio_content="",
            existing_cover_letters=[],
            company_research="",
            job_requirements={},
            current_cover_letter={},
            comparison_score=0.0,
            feedback="",
            iteration_count=0,
            final_cover_letter={},
            final_score=0.0,
            error=None,
        )

        await graph.ainvoke(initial_state)

    except Exception as e:
        # Update session with error
        async with async_session_maker() as db:
            result = await db.execute(
                select(AISession).where(AISession.id == UUID(session_id))
            )
            session = result.scalar_one_or_none()
            if session:
                session.status = "failed"
                session.error_message = str(e)
                await db.commit()
