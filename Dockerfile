# syntax=docker/dockerfile:1
FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# LightGBM requires libgomp (GNU OpenMP) — stripped from slim images
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files first (layer cache)
COPY pyproject.toml uv.lock* ./

# Install production dependencies only (no dev, no editable install)
RUN uv sync --frozen --no-dev --no-install-project

# Copy only what the backend needs at runtime
COPY backend/ ./backend/
COPY data-pipeline/artifacts/ ./data-pipeline/artifacts/

# Cloud Run injects $PORT; default 8080
ENV PORT=8080

EXPOSE 8080

CMD ["uv", "run", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
