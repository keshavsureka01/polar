from pydantic import BaseModel

class ForecastPoint(BaseModel):
    timestamp: str
    predicted_demand_kw: float
    predicted_solar_kw: float
    predicted_wind_kw: float
    optimized_generator_kw: float
