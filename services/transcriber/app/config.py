from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import os


DEFAULT_MAX_SECONDS = 30


@dataclass(frozen=True)
class Settings:
    transcriber_api_key: str
    whisper_model: str
    whisper_cache_dir: str
    port: int
    default_max_seconds: int = DEFAULT_MAX_SECONDS
    max_download_bytes: int = 250 * 1024 * 1024
    request_timeout_seconds: float = 120.0


def _parse_port(value: str | None) -> int:
    try:
        parsed = int(value or "8000")
    except ValueError:
        return 8000

    return parsed if parsed > 0 else 8000


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        transcriber_api_key=os.environ.get("TRANSCRIBER_API_KEY", "change-me"),
        whisper_model=os.environ.get("WHISPER_MODEL", "base"),
        whisper_cache_dir=os.environ.get("WHISPER_CACHE_DIR", "/opt/whisper-cache"),
        port=_parse_port(os.environ.get("PORT")),
    )
