from typing import Any
from pydantic import BaseModel, ConfigDict

class StationDashboardResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    station: dict[str, Any]
    environment: dict[str, Any]
    fuel: dict[str, Any]
    battery: dict[str, Any]
    energy: dict[str, Any]
    forecast: list[dict[str, Any]]
    dispatch: list[dict[str, Any]]
    loads: dict[str, Any]
    optimization_impact: dict[str, Any]
    alerts: list[dict[str, Any]]
    recommendation: dict[str, Any]
    scenario: dict[str, Any]
