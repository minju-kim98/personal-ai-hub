"""Translation LangGraph Workflows."""
import re
from typing import List
from langchain_core.messages import HumanMessage

from app.services.llm import get_model


async def run_translation_graph(
    content: str,
    source_language: str,
    target_language: str,
    context: str = None,
) -> str:
    """Run text translation."""
    model = get_model("gpt-5-mini")

    context_info = f"\n상황: {context}" if context else ""

    prompt = f"""
    다음 텍스트를 {target_language}로 번역해주세요.
    {context_info}

    원문:
    {content}

    요구사항:
    1. 자연스러운 {target_language} 표현 사용
    2. 원문의 뉘앙스와 톤 유지
    3. 문화적 맥락 고려

    번역문만 출력해주세요.
    """

    response = await model.ainvoke([HumanMessage(content=prompt)])
    return response.content


async def run_srt_translation(
    srt_content: str,
    target_language: str,
) -> str:
    """Translate SRT subtitle file while preserving timestamps."""
    model = get_model("gpt-5-mini")

    # Parse SRT
    blocks = srt_content.strip().split("\n\n")
    translated_blocks = []

    # Process in batches
    batch_size = 10
    for i in range(0, len(blocks), batch_size):
        batch = blocks[i:i + batch_size]

        # Extract text from batch
        texts = []
        for block in batch:
            lines = block.split("\n")
            if len(lines) >= 3:
                text = "\n".join(lines[2:])
                texts.append(text)

        if not texts:
            translated_blocks.extend(batch)
            continue

        # Translate batch
        prompt = f"""
        다음 자막 텍스트들을 {target_language}로 번역해주세요.
        각 자막은 [SEP] 구분자로 구분됩니다.

        {" [SEP] ".join(texts)}

        요구사항:
        1. 자연스러운 구어체 사용
        2. 자막 특성상 간결하게 번역
        3. 각 번역도 [SEP]로 구분하여 출력

        번역문만 출력해주세요.
        """

        response = await model.ainvoke([HumanMessage(content=prompt)])
        translations = response.content.split("[SEP]")

        # Reconstruct blocks with translations
        for j, block in enumerate(batch):
            lines = block.split("\n")
            if len(lines) >= 3 and j < len(translations):
                # Keep index and timestamp, replace text
                new_block = f"{lines[0]}\n{lines[1]}\n{translations[j].strip()}"
                translated_blocks.append(new_block)
            else:
                translated_blocks.append(block)

    return "\n\n".join(translated_blocks)


async def run_email_writing(
    context: str,
    key_points: str,
    target_language: str,
) -> str:
    """Write an email in target language with appropriate tone."""
    model = get_model("claude-haiku-4.5")

    prompt = f"""
    다음 상황과 핵심 내용을 바탕으로 {target_language}로 이메일을 작성해주세요.

    ## 상황
    {context}

    ## 전달할 핵심 내용
    {key_points}

    ## 요구사항
    1. {target_language}의 비즈니스 이메일 관례에 맞게 작성
    2. 적절한 인사말과 마무리 포함
    3. 정중하고 전문적인 톤 유지
    4. 문화적으로 적절한 표현 사용

    이메일 전문을 출력해주세요.
    """

    response = await model.ainvoke([HumanMessage(content=prompt)])
    return response.content
