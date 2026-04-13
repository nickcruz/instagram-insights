from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI

from .auth import require_api_key
from .config import get_settings
from .schemas import HealthResponse, TranscriptionRequest, TranscriptionResponse
from .service import MediaTranscriptionError, get_transcription_service


@asynccontextmanager
async def lifespan(_: FastAPI):
    await asyncio.to_thread(get_transcription_service().warmup)
    yield


app = FastAPI(title="Instasights Offline Transcriber", lifespan=lifespan)


@app.get("/health", response_model=HealthResponse)
async def healthcheck() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(model=settings.whisper_model)


@app.post(
    "/v1/transcriptions",
    response_model=TranscriptionResponse,
    dependencies=[Depends(require_api_key)],
)
async def create_transcription(
    payload: TranscriptionRequest,
) -> TranscriptionResponse:
    settings = get_settings()
    max_seconds = payload.maxSeconds or settings.default_max_seconds

    try:
        artifact = await asyncio.to_thread(
            get_transcription_service().transcribe_media,
            str(payload.mediaUrl),
            max_seconds,
        )
    except MediaTranscriptionError as exc:
        return TranscriptionResponse(
            mediaId=payload.mediaId,
            status="failed",
            transcriptText=None,
            language=None,
            model=exc.model or settings.whisper_model,
            clipSeconds=exc.clip_seconds,
            truncated=exc.truncated,
            error=exc.message,
        )

    return TranscriptionResponse(
        mediaId=payload.mediaId,
        status="completed",
        transcriptText=artifact.text,
        language=artifact.language,
        model=artifact.model,
        clipSeconds=artifact.clip_seconds,
        truncated=artifact.truncated,
    )
