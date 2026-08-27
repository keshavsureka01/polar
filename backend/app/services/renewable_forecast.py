from app.core.engine import scenario_data


def forecast_renewables(hours: int = 48, scenario: str = "normal"):
    _, _, renewables = scenario_data(scenario)
    return [{"timestamp": row["timestamp"], "solar_kw": row["solar_generation_kw"], "wind_kw": row["wind_generation_kw"], "total_renewable_kw": row["total_renewable_kw"]} for row in renewables[:hours]]
