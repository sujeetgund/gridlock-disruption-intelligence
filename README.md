# Disruption Impact & Response Intelligence System

Gridlock Hackathon 2.0 — Theme 2 (Event-Driven Congestion)

This repository contains the data pipeline, FastAPI backend, and Next.js frontend dashboard.

## Setup Instructions

### 1. Backend Setup
The data pipeline and backend use `uv` as the package manager to avoid polluting your global Python environment.

```bash
cd project
# Run the FastAPI server
uv run uvicorn backend.main:app --port 8000
```

### 2. Frontend Setup
The frontend uses Next.js 16 App Router, styled with Tailwind CSS and Shadcn/ui.

```bash
cd project/frontend
pnpm install
pnpm run dev
```

### 3. Environment Variables
By default, the Next.js frontend will proxy `/api` requests to `http://127.0.0.1:8000`. This is a convenience for local testing.

If you deploy the backend somewhere else (e.g. Vercel, Render), you must set the `BACKEND_URL` environment variable for the frontend to rewrite the requests correctly.

Example:
```env
# .env.local
BACKEND_URL=https://my-hosted-fastapi-backend.com
```
