from __future__ import annotations

from dataclasses import dataclass
from importlib import import_module
import subprocess
from pathlib import Path
import tempfile
import threading

import httpx

from .config import Settings, get_settings


@dataclass(frozen=True)
class TranscriptionArtifact:
    text: str
    language: str | None
    model: str
    clip_seconds: int
    truncated: bool


@dataclass(frozen=True)
class MediaTranscriptionError(Exception):
    message: str
    clip_seconds: int = 0
    truncated: bool = False
    model: str | None = None

    def __str__(self) -> str:
        return self.message


class LocalWhisperTranscriptionService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._model = None
        self._lock = threading.Lock()

    def warmup(self) -> None:
        self._get_model()

    def transcribe_media(self, media_url: str, max_seconds: int) -> TranscriptionArtifact:
        with tempfile.TemporaryDirectory(prefix="transcriber-") as temp_dir_name:
            temp_dir = Path(temp_dir_name)
            source_path = temp_dir / "source.media"
            clip_path = temp_dir / "clip.wav"

            self._download_media(media_url, source_path)
            duration_seconds = self._probe_duration_seconds(source_path)
            clip_seconds = self._resolve_clip_seconds(duration_seconds, max_seconds)
            truncated = duration_seconds is not None and duration_seconds > max_seconds

            self._extract_audio_clip(
                source_path=source_path,
                clip_path=clip_path,
                max_seconds=max_seconds,
            )

            model = self._get_model()

            try:
                result = model.transcribe(str(clip_path), fp16=False, verbose=False)
            except Exception as exc:  # pragma: no cover - defensive
                raise MediaTranscriptionError(
                    "Whisper failed to transcribe the media clip.",
                    clip_seconds=clip_seconds,
                    truncated=truncated,
                    model=self._settings.whisper_model,
                ) from exc

            text = str(result.get("text", "")).strip()
            if not text:
                raise MediaTranscriptionError(
                    "Whisper returned an empty transcript.",
                    clip_seconds=clip_seconds,
                    truncated=truncated,
                    model=self._settings.whisper_model,
                )

            language = result.get("language")
            if language is not None:
                language = str(language)

            return TranscriptionArtifact(
                text=text,
                language=language,
                model=self._settings.whisper_model,
                clip_seconds=clip_seconds,
                truncated=truncated,
            )

    def _get_model(self):
        if self._model is not None:
            return self._model

        with self._lock:
            if self._model is None:
                whisper_module = import_module("whisper")
                self._model = whisper_module.load_model(
                    self._settings.whisper_model,
                    download_root=self._settings.whisper_cache_dir,
                )

        return self._model

    def _download_media(self, media_url: str, destination: Path) -> None:
        bytes_written = 0
        headers = {"user-agent": "instagram-transcriber/1.0"}
        timeout = httpx.Timeout(self._settings.request_timeout_seconds)

        try:
            with httpx.stream(
                "GET",
                media_url,
                follow_redirects=True,
                headers=headers,
                timeout=timeout,
            ) as response:
                response.raise_for_status()
                with destination.open("wb") as output:
                    for chunk in response.iter_bytes():
                        if not chunk:
                            continue
                        bytes_written += len(chunk)
                        if bytes_written > self._settings.max_download_bytes:
                            raise MediaTranscriptionError(
                                "Media download exceeded the configured size limit.",
                                model=self._settings.whisper_model,
                            )
                        output.write(chunk)
        except MediaTranscriptionError:
            raise
        except httpx.HTTPError as exc:
            raise MediaTranscriptionError(
                "Unable to download the media URL for transcription.",
                model=self._settings.whisper_model,
            ) from exc

        if bytes_written == 0:
            raise MediaTranscriptionError(
                "Downloaded media was empty.",
                model=self._settings.whisper_model,
            )

    def _probe_duration_seconds(self, source_path: Path) -> float | None:
        process = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(source_path),
            ],
            capture_output=True,
            text=True,
            check=False,
        )

        if process.returncode != 0:
            return None

        try:
            return float(process.stdout.strip())
        except ValueError:
            return None

    def _extract_audio_clip(
        self,
        *,
        source_path: Path,
        clip_path: Path,
        max_seconds: int,
    ) -> None:
        process = subprocess.run(
            [
                "ffmpeg",
                "-nostdin",
                "-y",
                "-i",
                str(source_path),
                "-t",
                str(max_seconds),
                "-vn",
                "-ac",
                "1",
                "-ar",
                "16000",
                "-f",
                "wav",
                str(clip_path),
            ],
            capture_output=True,
            text=True,
            check=False,
        )

        if process.returncode != 0:
            raise MediaTranscriptionError(
                "ffmpeg could not extract an audio clip from the media.",
                model=self._settings.whisper_model,
            )

    @staticmethod
    def _resolve_clip_seconds(duration_seconds: float | None, max_seconds: int) -> int:
        if duration_seconds is None:
            return max_seconds

        if duration_seconds <= 0:
            return max_seconds

        return max(1, min(max_seconds, int(duration_seconds)))


_service: LocalWhisperTranscriptionService | None = None


def get_transcription_service() -> LocalWhisperTranscriptionService:
    global _service

    if _service is None:
        _service = LocalWhisperTranscriptionService(get_settings())

    return _service
