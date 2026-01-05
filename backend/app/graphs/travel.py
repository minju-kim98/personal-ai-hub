"""Travel/Date Course Planning LangGraph Workflow."""
import json
from typing import TypedDict, List, Optional
from datetime import datetime, date
from uuid import UUID

from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage

from app.services.llm import get_model
from app.core.database import async_session_maker
from app.models.ai_session import AISession
from app.models.travel import TravelPlan
from sqlalchemy import select


class TravelState(TypedDict):
    """State for travel planning."""
    session_id: str
    user_id: str
    travel_type: str
    start_date: str
    end_date: str
    departure: str
    destination: str
    interests: List[str]
    budget_range: Optional[str]
    companions: Optional[str]
    special_requests: Optional[str]

    # Generated content
    places: List[dict]
    timeline: List[dict]
    budget: dict
    checklist: List[str]
    content: dict
    error: Optional[str]


async def search_places(state: TravelState) -> TravelState:
    """Search for recommended places."""
    model = get_model("gpt-5-mini")

    travel_type_kr = "여행" if state["travel_type"] == "travel" else "데이트"
    interests_str = ", ".join(state["interests"]) if state["interests"] else "일반"

    prompt = f"""
    {state["destination"]}에서 {travel_type_kr}하기 좋은 장소를 추천해주세요.

    ## 조건
    - 기간: {state["start_date"]} ~ {state["end_date"]}
    - 관심사: {interests_str}
    - 동행: {state.get("companions") or "미정"}
    - 예산: {state.get("budget_range") or "미정"}

    다음 카테고리별로 3-5개씩 추천해주세요:
    1. 맛집 (식사)
    2. 카페/디저트
    3. 관광 명소
    4. 숙소 (1박 이상인 경우)

    JSON 형식으로 출력:
    {{
        "restaurants": [
            {{"name": "이름", "category": "분류", "price_range": "가격대", "rating": 4.5, "address": "주소", "tip": "방문팁"}}
        ],
        "cafes": [...],
        "attractions": [...],
        "accommodations": [...]
    }}
    """

    response = await model.ainvoke([HumanMessage(content=prompt)])

    try:
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        places = json.loads(content.strip())
    except (json.JSONDecodeError, IndexError):
        places = {"restaurants": [], "cafes": [], "attractions": [], "accommodations": []}

    return {
        **state,
        "places": [places],
    }


async def create_timeline(state: TravelState) -> TravelState:
    """Create optimized timeline."""
    model = get_model("gpt-5-mini")

    places_json = json.dumps(state["places"][0] if state["places"] else {}, ensure_ascii=False)

    prompt = f"""
    다음 장소들을 바탕으로 최적의 일정을 계획해주세요.

    ## 기간
    {state["start_date"]} ~ {state["end_date"]}

    ## 출발지
    {state["departure"]}

    ## 목적지
    {state["destination"]}

    ## 추천 장소
    {places_json}

    ## 특별 요청
    {state.get("special_requests") or "없음"}

    일정을 시간대별로 계획하고 JSON 형식으로 출력해주세요:
    {{
        "days": [
            {{
                "date": "2026-01-20",
                "day_title": "Day 1",
                "schedule": [
                    {{"time": "09:00", "activity": "출발", "place": "서울", "duration": "2시간 30분", "notes": "고속도로 이용"}},
                    {{"time": "11:30", "activity": "점심", "place": "맛집명", "duration": "1시간", "notes": "예약 필요"}}
                ]
            }}
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

        timeline = json.loads(content.strip())
    except (json.JSONDecodeError, IndexError):
        timeline = {"days": []}

    return {
        **state,
        "timeline": timeline.get("days", []),
    }


async def calculate_budget(state: TravelState) -> TravelState:
    """Calculate estimated budget."""
    model = get_model("gpt-5-nano")

    prompt = f"""
    다음 여행 일정의 예상 비용을 계산해주세요.

    ## 기간
    {state["start_date"]} ~ {state["end_date"]}

    ## 목적지
    {state["destination"]}

    ## 동행
    {state.get("companions") or "1인"}

    ## 일정 개요
    {json.dumps(state["timeline"][:2], ensure_ascii=False) if state["timeline"] else "일반적인 일정"}

    항목별로 예상 비용을 계산하고 JSON 형식으로 출력:
    {{
        "transportation": {{"description": "교통비", "amount": 50000}},
        "accommodation": {{"description": "숙박비", "amount": 150000}},
        "food": {{"description": "식비", "amount": 80000}},
        "activities": {{"description": "관람/체험비", "amount": 30000}},
        "etc": {{"description": "기타", "amount": 20000}},
        "total": 330000,
        "per_person": 165000
    }}
    """

    response = await model.ainvoke([HumanMessage(content=prompt)])

    try:
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        budget = json.loads(content.strip())
    except (json.JSONDecodeError, IndexError):
        budget = {"total": 0, "note": "비용 계산 실패"}

    return {
        **state,
        "budget": budget,
    }


async def create_checklist(state: TravelState) -> TravelState:
    """Create packing checklist."""
    model = get_model("gpt-5-nano")

    prompt = f"""
    다음 여행을 위한 준비물 체크리스트를 만들어주세요.

    ## 목적지
    {state["destination"]}

    ## 기간
    {state["start_date"]} ~ {state["end_date"]}

    ## 동행
    {state.get("companions") or "1인"}

    ## 관심사
    {", ".join(state["interests"]) if state["interests"] else "일반"}

    필수 준비물을 카테고리별로 정리해서 JSON 배열로 출력:
    ["신분증", "충전기", "여벌 옷", ...]
    """

    response = await model.ainvoke([HumanMessage(content=prompt)])

    try:
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        elif "[" in content:
            content = content[content.index("["):content.rindex("]") + 1]

        checklist = json.loads(content.strip())
    except (json.JSONDecodeError, IndexError, ValueError):
        checklist = ["신분증", "충전기", "보조배터리", "여벌 옷", "세면도구", "상비약", "현금"]

    return {
        **state,
        "checklist": checklist,
    }


async def save_plan(state: TravelState) -> TravelState:
    """Save the travel plan."""
    travel_type_kr = "여행" if state["travel_type"] == "travel" else "데이트"
    title = f"{state['destination']} {travel_type_kr} ({state['start_date']} ~ {state['end_date']})"

    content = {
        "places": state["places"][0] if state["places"] else {},
        "timeline": state["timeline"],
        "budget": state["budget"],
        "checklist": state["checklist"],
    }

    async with async_session_maker() as db:
        result = await db.execute(
            select(AISession).where(AISession.id == UUID(state["session_id"]))
        )
        session = result.scalar_one_or_none()

        if session:
            session.status = "completed"
            session.completed_at = datetime.utcnow()
            session.output_data = {"title": title}

            # Parse dates
            start = datetime.strptime(state["start_date"], "%Y-%m-%d").date()
            end = datetime.strptime(state["end_date"], "%Y-%m-%d").date()

            plan = TravelPlan(
                session_id=session.id,
                title=title,
                start_date=start,
                end_date=end,
                content=content,
            )
            db.add(plan)
            await db.commit()

    return {
        **state,
        "content": content,
    }


def create_travel_graph():
    """Create the travel planning graph."""
    workflow = StateGraph(TravelState)

    workflow.add_node("search_places", search_places)
    workflow.add_node("create_timeline", create_timeline)
    workflow.add_node("calculate_budget", calculate_budget)
    workflow.add_node("create_checklist", create_checklist)
    workflow.add_node("save_plan", save_plan)

    workflow.set_entry_point("search_places")
    workflow.add_edge("search_places", "create_timeline")
    workflow.add_edge("create_timeline", "calculate_budget")
    workflow.add_edge("calculate_budget", "create_checklist")
    workflow.add_edge("create_checklist", "save_plan")
    workflow.add_edge("save_plan", END)

    return workflow.compile()


async def run_travel_graph(
    session_id: str,
    user_id: str,
    input_data: dict
):
    """Run the travel planning graph."""
    try:
        async with async_session_maker() as db:
            result = await db.execute(
                select(AISession).where(AISession.id == UUID(session_id))
            )
            session = result.scalar_one_or_none()
            if session:
                session.status = "processing"
                await db.commit()

        graph = create_travel_graph()

        initial_state = TravelState(
            session_id=session_id,
            user_id=user_id,
            travel_type=input_data["travel_type"],
            start_date=str(input_data["start_date"]),
            end_date=str(input_data["end_date"]),
            departure=input_data["departure"],
            destination=input_data["destination"],
            interests=input_data.get("interests", []),
            budget_range=input_data.get("budget_range"),
            companions=input_data.get("companions"),
            special_requests=input_data.get("special_requests"),
            places=[],
            timeline=[],
            budget={},
            checklist=[],
            content={},
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
