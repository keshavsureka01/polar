from pydantic import BaseModel

class DispatchPoint(BaseModel):
    timestamp: str
    demand_kw: float
    solar_kw: float
    wind_kw: float
    generator_kw: float
    battery_charge_kw: float
    battery_discharge_kw: float
    battery_soc_percent: float
