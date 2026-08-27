from pydantic import BaseModel

class StationInfo(BaseModel):
    name: str
    location: str
    status: str

class EnvironmentState(BaseModel):
    temperature_c: float
    wind_speed_ms: float
    solar_irradiance_wm2: float
    weather_status: str
