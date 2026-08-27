from fastapi import APIRouter
from app.core.engine import dashboard
from app.models.simulation import SimulationRequest

router = APIRouter(prefix="/api")

@router.post("/simulation/run")
def run_simulation(request: SimulationRequest):
    return dashboard(request.scenario)
