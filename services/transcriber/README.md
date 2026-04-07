# Offline Transcriber Service

This service exposes a small authenticated HTTP API for transcribing Instagram
video media with the local `openai-whisper` library inside a container.

## Endpoints

- `GET /health`
- `POST /v1/transcriptions`

The transcription endpoint requires an `x-api-key` header and accepts:

```json
{
  "mediaId": "18071037758098173",
  "mediaUrl": "https://example.com/video.mp4",
  "maxSeconds": 30
}
```

## Local Development

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip "setuptools<81" wheel
pip install --index-url https://download.pytorch.org/whl/cpu "torch==2.6.0"
pip install --no-build-isolation -r services/transcriber/requirements.txt -r services/transcriber/requirements-dev.txt
export TRANSCRIBER_API_KEY="dev-secret"
export WHISPER_MODEL="base"
export WHISPER_CACHE_DIR="$PWD/.whisper-cache"
uvicorn app.main:app --app-dir services/transcriber --reload
```

## Test

```bash
python3 -m pytest services/transcriber/tests
```

## Container Build

```bash
docker build -f services/transcriber/Dockerfile .
```
