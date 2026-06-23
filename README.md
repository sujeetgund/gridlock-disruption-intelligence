# Disruption Impact & Response Intelligence System

Gridlock Hackathon 2.0 — Theme 2 (Event-Driven Congestion)

This repository contains the data pipeline, FastAPI backend, and Next.js frontend dashboard.

_This system forecasts the congestion impact of event-driven disruptions and recommends proportional officer deployment. It is built on the `astram_event_data.csv` dataset comprising 8,173 real-world Bengaluru Traffic Police (BTP) incident records. See [METHODOLOGY.md](METHODOLOGY.md) and [FEATURE_AVAILABILITY.md](FEATURE_AVAILABILITY.md) for the full data audit, scoring methodology, and known limitations._

## Features

1. **Live Disruption Map:** A stratified sample of critical events across Bengaluru.
2. **Response Recommendation Engine:** Simulates event outcomes (duration, recommended officer deployment) based on historical corridor precedence, prioritizing real-time reportable factors over post-resolution label leakage.
3. **Post-Event Learning Replay:** Chronological replay of historical events to measure the system's predictive calibration over time.

## Data

The core dataset used to build and backtest this system is located at [astram_event_data.csv](data/astram_event_data.csv). It contains 8,173 real-world Bengaluru Traffic Police (BTP) incident records.

## Data Pipeline & Artifacts

The system relies on a sequence of Python scripts in `data-pipeline/` to clean the raw dataset, compute historical severity scores, generate rule-based predictive cutoffs, and train the LightGBM machine learning model.

To run the pipeline from scratch:
```bash
cd project/data-pipeline
python clean.py
python severity_score.py
python predictive_score.py
python calibration_ledger.py
python train_model.py
python validate.py
```

This pipeline generates several pre-computed `artifacts/` (JSON and Parquet files) that the FastAPI backend loads into memory on startup. Key artifacts include:
- `cleaned_data.parquet`: The standardized historical ledger.
- `predictive_cutoffs.json`: Thresholds and corridor frequencies for the rule-based Engine.
- `model.pkl`: The trained LightGBM model for the directional read.
- `calibration_ledger.json` & `calibration_summary.json`: Used by the frontend Timeline Replay to plot the gap between predicted vs. resolved severity.

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
