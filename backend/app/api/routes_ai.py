from fastapi import APIRouter
from app.core.engine import dashboard
from pydantic import BaseModel
from app.models.simulation import SimulationRequest

router = APIRouter(prefix="/api")

class Briefing(BaseModel):
    action: str
    summary: str
    reasons: list[str]
    expected_impact: dict[str, float]

@router.post("/ai/briefing", response_model=Briefing)
def get_briefing(request: SimulationRequest):
    return dashboard(request.scenario)["recommendation"]
