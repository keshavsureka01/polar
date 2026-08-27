from __future__ import annotations

import logging
import os
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from app.core.engine import SCENARIOS, dashboard
from app.schemas.api_response import StationDashboardResponse

logging.basicConfig(level=logging.INFO)
load_dotenv()
app = FastAPI(title="POLAR-E Backend", version="0.1.0")
origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class ScenarioRequest(BaseModel):
    scenario: str = Field(default="normal")

class Briefing(BaseModel):
    action: str
    summary: str
    reasons: list[str]
    expected_impact: dict[str, float]


def valid_scenario(scenario: str) -> None:
    if scenario not in SCENARIOS:
        raise HTTPException(status_code=400, detail={"error": "Invalid scenario", "message": f"Supported scenarios: {', '.join(SCENARIOS)}"})


def fallback_briefing(state: dict[str, Any]) -> dict[str, Any]:
    recommendation = state["recommendation"]
    return Briefing(**recommendation).model_dump()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/station", response_model=StationDashboardResponse)
def station() -> dict[str, Any]:
    return dashboard()


@app.get("/api/forecast")
def forecast(hours: int = Query(default=48, ge=1, le=168)) -> dict[str, Any]:
    state = dashboard()
    return {"hours": hours, "data": state["forecast"][:hours]}


@app.post("/api/simulation/run", response_model=StationDashboardResponse)
def simulation(request: ScenarioRequest) -> dict[str, Any]:
    valid_scenario(request.scenario)
    return dashboard(request.scenario)


@app.post("/api/ai/briefing", response_model=Briefing)
def briefing(request: ScenarioRequest) -> dict[str, Any]:
    valid_scenario(request.scenario)
    state = dashboard(request.scenario)
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return fallback_briefing(state)
    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"), messages=[{"role": "system", "content": "Return only valid JSON with action, summary, reasons, and expected_impact."}, {"role": "user", "content": str({"station": state["station"]["name"], "scenario": request.scenario, "battery": state["battery"], "fuel": state["fuel"], "recommendation": state["recommendation"]})}], response_format={"type": "json_object"}, temperature=0.1)
        return Briefing.model_validate_json(response.choices[0].message.content).model_dump()
    except Exception:
        logging.exception("AI briefing unavailable; using deterministic fallback")
        return fallback_briefing(state)


@app.exception_handler(ValueError)
async def value_error_handler(_, exception: ValueError):
    logging.exception("Backend data error")
    return JSONResponse(status_code=500, content={"error": "Data error", "message": str(exception)})
