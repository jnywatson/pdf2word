# Multi-stage Dockerfile for PDF2WORD PRO
# Stage 1: Build modern frontend SPA (Vite + React + TailwindCSS)
FROM node:20-slim AS frontend-builder
WORKDIR /build/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Final Production Runner (Python 3.11 + Tesseract OCR + Poppler utilities)
FROM python:3.11-slim

# Prevent Python from writing .pyc and buffer stdin/stdout
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=8000

WORKDIR /app

# Install system dependencies:
# - tesseract-ocr, tesseract-ocr-fra, tesseract-ocr-eng for high accuracy OCR
# - poppler-utils for robust PDF rendering
# - libgl1, libglib2.0-0 for graphics and image processing libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-fra \
    tesseract-ocr-eng \
    tesseract-ocr-osd \
    poppler-utils \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Verify tesseract installation and language models
RUN tesseract --version && tesseract --list-langs

# Copy Python requirements and install
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/ ./backend/

# Copy compiled frontend from Stage 1 into the location expected by FastAPI static mount
COPY --from=frontend-builder /build/frontend/dist ./frontend/dist

# Initialize storage directories
RUN mkdir -p /app/storage/uploads /app/storage/outputs /app/storage/temp && \
    chmod -R 777 /app/storage

# Add healthcheck to verify container readiness
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

EXPOSE 8000

# Start unified web server (FastAPI serves both API and React frontend)
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"]
