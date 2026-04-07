from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import sys

from fastapi.testclient import TestClient
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import main
from app.service import MediaTranscriptionError, TranscriptionArtifact


@dataclass
class FakeService:
    warmup_calls: int = 0
    last_call: tuple[str, int] | None = None
    result: TranscriptionArtifact | None = None
    error: MediaTranscriptionError | None = None

    def warmup(self) -> None:
        self.warmup_calls += 1

    def transcribe_media(self, media_url: str, max_seconds: int) -> TranscriptionArtifact:
        self.last_call = (media_url, max_seconds)
        if self.error is not None:
            raise self.error
        assert self.result is not None
        return self.result


@pytest.fixture(autouse=True)
def reset_settings_cache(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("TRANSCRIBER_API_KEY", "test-key")
    monkeypatch.setenv("WHISPER_MODEL", "base")
    monkeypatch.setenv("WHISPER_CACHE_DIR", "/tmp/whisper-cache")
    main.get_settings.cache_clear()
    yield
    main.get_settings.cache_clear()


def create_client(monkeypatch: pytest.MonkeyPatch, fake_service: FakeService) -> TestClient:
    monkeypatch.setattr(main, "get_transcription_service", lambda: fake_service)
    return TestClient(main.app)


def test_healthcheck_reports_model(monkeypatch: pytest.MonkeyPatch):
    client = create_client(
        monkeypatch,
        FakeService(
            result=TranscriptionArtifact(
                text="unused",
                language="en",
                model="base",
                clip_seconds=30,
                truncated=False,
            )
        ),
    )

    with client as session:
        response = session.get("/health")

    assert response.status_code == 200
    assert response.json() == {"ok": True, "model": "base", "service": "transcriber"}


def test_startup_warms_the_model(monkeypatch: pytest.MonkeyPatch):
    fake_service = FakeService(
        result=TranscriptionArtifact(
            text="unused",
            language="en",
            model="base",
            clip_seconds=30,
            truncated=False,
        )
    )

    with create_client(monkeypatch, fake_service):
        pass

    assert fake_service.warmup_calls == 1


def test_missing_api_key_is_rejected(monkeypatch: pytest.MonkeyPatch):
    client = create_client(
        monkeypatch,
        FakeService(
            result=TranscriptionArtifact(
                text="unused",
                language="en",
                model="base",
                clip_seconds=30,
                truncated=False,
            )
        ),
    )

    with client as session:
        response = session.post(
            "/v1/transcriptions",
            json={"mediaId": "1", "mediaUrl": "https://example.com/video.mp4"},
        )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid or missing API key."}


def test_default_clip_length_is_30_seconds(monkeypatch: pytest.MonkeyPatch):
    fake_service = FakeService(
        result=TranscriptionArtifact(
            text="hello world",
            language="en",
            model="base",
            clip_seconds=30,
            truncated=True,
        )
    )
    client = create_client(monkeypatch, fake_service)

    with client as session:
        response = session.post(
            "/v1/transcriptions",
            headers={"x-api-key": "test-key"},
            json={"mediaId": "1", "mediaUrl": "https://example.com/video.mp4"},
        )

    assert response.status_code == 200
    assert fake_service.last_call == ("https://example.com/video.mp4", 30)
    assert response.json() == {
        "mediaId": "1",
        "status": "completed",
        "transcriptText": "hello world",
        "language": "en",
        "model": "base",
        "clipSeconds": 30,
        "truncated": True,
        "error": None,
    }


def test_explicit_clip_length_is_forwarded(monkeypatch: pytest.MonkeyPatch):
    fake_service = FakeService(
        result=TranscriptionArtifact(
            text="short clip",
            language="en",
            model="base",
            clip_seconds=12,
            truncated=False,
        )
    )
    client = create_client(monkeypatch, fake_service)

    with client as session:
        response = session.post(
            "/v1/transcriptions",
            headers={"x-api-key": "test-key"},
            json={
                "mediaId": "2",
                "mediaUrl": "https://example.com/video.mp4",
                "maxSeconds": 12,
            },
        )

    assert response.status_code == 200
    assert fake_service.last_call == ("https://example.com/video.mp4", 12)


def test_transcription_failures_return_failed_payloads(monkeypatch: pytest.MonkeyPatch):
    fake_service = FakeService(
        error=MediaTranscriptionError(
            "Unable to download the media URL for transcription.",
            clip_seconds=0,
            truncated=False,
            model="base",
        )
    )
    client = create_client(monkeypatch, fake_service)

    with client as session:
        response = session.post(
            "/v1/transcriptions",
            headers={"x-api-key": "test-key"},
            json={"mediaId": "3", "mediaUrl": "https://example.com/video.mp4"},
        )

    assert response.status_code == 200
    assert response.json() == {
        "mediaId": "3",
        "status": "failed",
        "transcriptText": None,
        "language": None,
        "model": "base",
        "clipSeconds": 0,
        "truncated": False,
        "error": "Unable to download the media URL for transcription.",
    }


def test_invalid_media_url_is_rejected_before_transcription(monkeypatch: pytest.MonkeyPatch):
    client = create_client(
        monkeypatch,
        FakeService(
            result=TranscriptionArtifact(
                text="unused",
                language="en",
                model="base",
                clip_seconds=30,
                truncated=False,
            )
        ),
    )

    with client as session:
        response = session.post(
            "/v1/transcriptions",
            headers={"x-api-key": "test-key"},
            json={"mediaId": "4", "mediaUrl": "not-a-url"},
        )

    assert response.status_code == 422
