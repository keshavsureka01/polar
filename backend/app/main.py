from __future__ import annotations

import logging
import json
import os
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from dotenv import load_dotenv

from app.core.engine import SCENARIOS, dashboard
from app.schemas.api_response import StationDashboardResponse

logging.basicConfig(level=logging.INFO)
load_dotenv()
app = FastAPI(title="POLAR-E Backend", version="0.1.0")
origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",") if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class ScenarioRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    scenario: str = Field(default="normal")
    baseline: dict[str, Any] | None = None
    scenario_state: dict[str, Any] | None = None

class Briefing(BaseModel):
    source: str
    headline: str
    situation: str
    action: str
    reasoning: list[str]
    risk: str
    tradeoff: str
    summary: str
    reasons: list[str]
    expected_impact: dict[str, float]


def valid_scenario(scenario: str) -> None:
    if scenario not in SCENARIOS:
        raise HTTPException(status_code=400, detail={"error": "Invalid scenario", "message": f"Supported scenarios: {', '.join(SCENARIOS)}"})


def fallback_briefing(state: dict[str, Any]) -> dict[str, Any]:
    recommendation = state["recommendation"]
    return Briefing(
        source="deterministic",
        headline=recommendation["action"],
        situation=recommendation["summary"],
        action=recommendation["action"],
        reasoning=recommendation["reasons"],
        risk="Critical loads must remain protected while the scenario is active.",
        tradeoff="The response may increase diesel use or reduce fuel endurance.",
        summary=recommendation["summary"],
        reasons=recommendation["reasons"],
        expected_impact=recommendation["expected_impact"],
    ).model_dump()


def compact_ai_context(state: dict[str, Any], request: ScenarioRequest) -> dict[str, Any]:
    baseline = request.baseline or state

    def compact(source: dict[str, Any]) -> dict[str, Any]:
        energy = source.get("energy", {})
        battery = source.get("battery", {})
        fuel = source.get("fuel", {})
        generators = source.get("generators", [])
        return {
            "load_kw": energy.get("totalLoadKw", energy.get("total_load_kw")),
            "renewable_kw": (energy.get("solarGenerationKw", energy.get("solar_generation_kw", 0)) + energy.get("windGenerationKw", energy.get("wind_generation_kw", 0))),
            "diesel_kw": energy.get("dieselGenerationKw", energy.get("diesel_generation_kw")),
            "battery_soc_percent": battery.get("socPercent", battery.get("soc_percent")),
            "fuel_endurance_days": fuel.get("enduranceDays", fuel.get("endurance_days")),
            "generators": [{"id": item.get("id"), "status": item.get("status"), "load_kw": item.get("loadKw", item.get("load_kw"))} for item in generators],
        }

    current = compact(state)
    baseline_values = compact(baseline)
    deltas = {
        key: round(current[key] - baseline_values[key], 2)
        for key in ("load_kw", "renewable_kw", "diesel_kw", "battery_soc_percent", "fuel_endurance_days")
        if isinstance(current.get(key), (int, float)) and isinstance(baseline_values.get(key), (int, float))
    }
    return {
        "scenario": request.scenario,
        "station": state["station"]["name"],
        "environment": {
            "temperature_c": state["environment"]["temperature_c"],
            "wind_speed_ms": state["environment"]["wind_speed_ms"],
        },
        "baseline": baseline_values,
        "scenario_state": current,
        "deltas": deltas,
        "alerts": [{"severity": alert.get("severity"), "message": alert.get("message")} for alert in state.get("alerts", [])],
        "deterministic_recommendation": state["recommendation"],
    }


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
        context = compact_ai_context(state, request)
        response = client.chat.completions.create(model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"), messages=[{"role": "system", "content": "You are POLAR-E's operator explanation layer. The numerical engine already calculated the response. Treat supplied values as authoritative. Do not invent, recalculate, or override them. Return only valid JSON with source groq, headline, situation, action, reasoning, risk, tradeoff, and summary. Keep every text field concise. Do not return expected_impact; Python supplies authoritative numeric impact."}, {"role": "user", "content": str(context)}], max_tokens=500, temperature=0.1, reasoning_effort="low")
        generated = json.loads(response.choices[0].message.content)
        reasoning = generated.get("reasoning") or generated.get("reasons") or [generated.get("situation", ""), generated.get("action", ""), generated.get("tradeoff", "")]
        if isinstance(reasoning, str):
            reasoning = [reasoning]
        generated["reasoning"] = reasoning[:3]
        generated["reasons"] = generated.get("reasons") or reasoning[:3]
        generated["source"] = "groq"
        generated["expected_impact"] = state["recommendation"]["expected_impact"]
        return Briefing.model_validate(generated).model_dump()
    except Exception:
        logging.exception("AI briefing unavailable; using deterministic fallback")
        return fallback_briefing(state)


@app.exception_handler(ValueError)
async def value_error_handler(_, exception: ValueError):
    logging.exception("Backend data error")
    return JSONResponse(status_code=500, content={"error": "Data error", "message": str(exception)})
