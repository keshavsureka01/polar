# POLAR-E Backend

FastAPI service for deterministic polar-station energy simulation. It uses the repository `datasets/` CSV files when present; otherwise it generates 30 days of internally consistent hourly synthetic data.

## Run

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

Copy `.env.example` to `.env` to configure `GROQ_API_KEY`, `GROQ_MODEL`, and `CORS_ORIGINS`. Groq only explains an already-computed numerical decision; the deterministic fallback is always available.

## API

- `GET /health`
- `GET /api/station`
- `GET /api/forecast?hours=48`
- `POST /api/simulation/run` with `{"scenario":"generator_failure"}`
- `POST /api/ai/briefing` with a supported scenario

Scenarios are `normal`, `extreme_cold`, `wind_icing`, and `generator_failure`. CSV timestamps must be UTC in `YYYY-MM-DD HH:MM:SS` format. Run backtests from the repository root with `npm run backtest`.
