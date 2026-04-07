FROM python:3.11-slim

ARG WHISPER_MODEL=base
ARG TORCH_VERSION=2.6.0

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    WHISPER_MODEL=${WHISPER_MODEL} \
    WHISPER_CACHE_DIR=/opt/whisper-cache

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY services/transcriber/requirements.txt /tmp/requirements.txt

RUN python -m pip install --no-cache-dir --upgrade pip "setuptools<81" wheel \
    && pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu "torch==${TORCH_VERSION}" \
    && pip install --no-cache-dir --no-build-isolation -r /tmp/requirements.txt

RUN mkdir -p "${WHISPER_CACHE_DIR}" \
    && python -c "import os, whisper; whisper.load_model(os.environ['WHISPER_MODEL'], download_root=os.environ['WHISPER_CACHE_DIR'])"

COPY services/transcriber/app /app/app

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
