from typing import Literal
from pydantic import BaseModel

class SimulationRequest(BaseModel):
    scenario: Literal["normal", "extreme_cold", "wind_icing", "generator_failure"] = "normal"
