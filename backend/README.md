# POLAR-E Backend

FastAPI MVP for deterministic polar-station energy simulation. It uses `weather.csv`, `station_load.csv`, and `renewable_generation.csv` from `app/data` when present; otherwise it generates 30 days of internally consistent hourly synthetic data.

## Run

```powershell
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Copy `.env.example` to `.env` to configure `GROQ_API_KEY`, `GROQ_MODEL`, and `CORS_ORIGINS`. Groq only explains an already-computed numerical decision; the deterministic fallback is always available.

## API

- `GET /health`
- `GET /api/station`
- `GET /api/forecast?hours=48`
- `POST /api/simulation/run` with `{"scenario":"generator_failure"}`
- `POST /api/ai/briefing` with a supported scenario

Scenarios are `normal`, `extreme_cold`, `wind_icing`, and `generator_failure`. CSV timestamps must be UTC in `YYYY-MM-DD HH:MM:SS` format. Run tests with `python -m unittest discover backend/tests`.
