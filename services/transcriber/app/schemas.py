from __future__ import annotations

from pydantic import BaseModel, Field, HttpUrl


class HealthResponse(BaseModel):
    ok: bool = True
    model: str
    service: str = "transcriber"


class TranscriptionRequest(BaseModel):
    mediaId: str = Field(min_length=1)
    mediaUrl: HttpUrl
    maxSeconds: int | None = Field(default=None, ge=1, le=600)


class TranscriptionResponse(BaseModel):
    mediaId: str
    status: str
    transcriptText: str | None = None
    language: str | None = None
    model: str
    clipSeconds: int
    truncated: bool
    error: str | None = None
