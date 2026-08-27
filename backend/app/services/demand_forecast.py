from app.core.engine import scenario_data


def forecast_demand(hours: int = 48, scenario: str = "normal"):
    _, loads, _ = scenario_data(scenario)
    return [{"timestamp": row["timestamp"], "predicted_demand_kw": round(float(row["total_load_kw"]), 2)} for row in loads[:hours]]
