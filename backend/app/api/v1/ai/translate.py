import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.ai_session import AISession
from app.models.translation import Translation
from app.schemas.translation import (
    TranslationCreate,
    TranslationResponse,
    SRTTranslationCreate,
    EmailWriteCreate,
)
from app.graphs.translate import run_translation_graph, run_srt_translation, run_email_writing

router = APIRouter()


@router.post("/text", response_model=TranslationResponse)
async def translate_text(
    request: TranslationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Translate or write text."""
    # Create AI session
    session = AISession(
        user_id=current_user.id,
        ai_type="translate",
        status="processing",
        input_data=request.model_dump(mode="json"),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    try:
        # Run translation
        result = await run_translation_graph(
            content=request.content,
            source_language=request.source_language,
            target_language=request.target_language,
            context=request.context,
        )

        # Create translation record
        translation = Translation(
            session_id=session.id,
            source_language=request.source_language,
            target_language=request.target_language,
            translation_type=request.translation_type,
            original_content=request.content,
            translated_content=result,
        )
        db.add(translation)

        # Update session
        session.status = "completed"
        session.output_data = {"translated_content": result}

        await db.commit()
        await db.refresh(translation)

        return translation

    except Exception as e:
        session.status = "failed"
        session.error_message = str(e)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Translation failed: {str(e)}"
        )


@router.post("/srt", response_model=TranslationResponse)
async def translate_srt(
    file: UploadFile = File(...),
    target_language: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Translate SRT subtitle file."""
    # Validate file
    if not file.filename.endswith(".srt"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .srt files are allowed"
        )

    content = await file.read()
    try:
        srt_content = content.decode("utf-8")
    except UnicodeDecodeError:
        srt_content = content.decode("cp949")  # Try Korean encoding

    # Create AI session
    session = AISession(
        user_id=current_user.id,
        ai_type="translate",
        status="processing",
        input_data={
            "type": "srt",
            "filename": file.filename,
            "target_language": target_language,
        },
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    try:
        # Run SRT translation
        translated = await run_srt_translation(
            srt_content=srt_content,
            target_language=target_language,
        )

        # Create translation record
        translation = Translation(
            session_id=session.id,
            source_language="auto",
            target_language=target_language,
            translation_type="srt",
            original_content=srt_content,
            translated_content=translated,
        )
        db.add(translation)

        # Update session
        session.status = "completed"
        session.output_data = {"translated_content": translated}

        await db.commit()
        await db.refresh(translation)

        return translation

    except Exception as e:
        session.status = "failed"
        session.error_message = str(e)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SRT translation failed: {str(e)}"
        )


@router.post("/email", response_model=TranslationResponse)
async def write_email(
    request: EmailWriteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Write an email in target language with appropriate tone."""
    # Create AI session
    session = AISession(
        user_id=current_user.id,
        ai_type="translate",
        status="processing",
        input_data=request.model_dump(mode="json"),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    try:
        # Run email writing
        result = await run_email_writing(
            context=request.context,
            key_points=request.key_points,
            target_language=request.target_language,
        )

        # Create translation record
        translation = Translation(
            session_id=session.id,
            source_language="ko",  # Assume Korean input
            target_language=request.target_language,
            translation_type="email",
            original_content=f"Context: {request.context}\nKey Points: {request.key_points}",
            translated_content=result,
        )
        db.add(translation)

        # Update session
        session.status = "completed"
        session.output_data = {"email_content": result}

        await db.commit()
        await db.refresh(translation)

        return translation

    except Exception as e:
        session.status = "failed"
        session.error_message = str(e)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Email writing failed: {str(e)}"
        )
