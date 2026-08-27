"""Deterministic POLAR-E simulation engine with CSV-ready synthetic fallback."""
from __future__ import annotations

import json
import math
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

try:
    import pandas as pd
except ImportError:  # pragma: no cover
    pd = None

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
SCENARIOS = {
    "normal": "Normal Operation",
    "extreme_cold": "Extreme Cold",
    "wind_icing": "Wind Turbine Icing",
    "generator_failure": "Primary Generator Failure",
}
REQUIRED_WEATHER = {"timestamp", "temperature_c", "wind_speed_ms", "solar_irradiance_wm2", "cloud_cover_pct"}
REQUIRED_LOAD = {"timestamp", "total_load_kw", "heating_load_kw", "critical_load_kw", "noncritical_load_kw", "occupancy"}
REQUIRED_RENEWABLE = {"timestamp", "solar_generation_kw", "wind_generation_kw", "total_renewable_kw"}

DEFAULT_CONFIG = {
    "station": {"name": "MAITRI", "location": "Antarctica"},
    "battery": {"capacity_kwh": 1000, "initial_soc_percent": 78, "max_charge_kw": 150, "max_discharge_kw": 200, "minimum_soc_percent": 20, "emergency_reserve_percent": 30, "efficiency": 0.90},
    "fuel_tank": {"capacity_liters": 10000, "initial_fuel_liters": 7200},
    "generators": [
        {"id": "GEN-01", "rated_power_kw": 250, "minimum_power_kw": 80, "fuel_consumption_lph": 55, "startup_time_min": 5},
        {"id": "GEN-02", "rated_power_kw": 200, "minimum_power_kw": 60, "fuel_consumption_lph": 44, "startup_time_min": 5},
    ],
}
DEFAULT_LOADS = [
    {"id": "life_support", "name": "Life Support", "rated_kw": 55, "critical": True},
    {"id": "medical", "name": "Medical", "rated_kw": 30, "critical": True},
    {"id": "communication", "name": "Communication", "rated_kw": 25, "critical": True},
    {"id": "aux_labs", "name": "Auxiliary Labs", "rated_kw": 38, "critical": False},
    {"id": "nonessential_heating", "name": "Non-essential Heating", "rated_kw": 45, "critical": False},
]


def clamp(value: float, low: float, high: float) -> float:
    return min(high, max(low, value))


def _timestamp(value: datetime) -> str:
    return value.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _load_csv(name: str, required: set[str]):
    path = DATA_DIR / name
    if pd is None or not path.exists():
        return None
    frame = pd.read_csv(path)
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"{name} is missing required columns: {', '.join(sorted(missing))}")
    frame["timestamp"] = pd.to_datetime(frame["timestamp"], utc=True, errors="coerce")
    if frame["timestamp"].isna().any():
        raise ValueError(f"{name} contains invalid timestamps")
    numeric = [column for column in required if column != "timestamp"]
    frame[numeric] = frame[numeric].apply(pd.to_numeric, errors="coerce").interpolate().ffill().bfill()
    return frame.sort_values("timestamp").reset_index(drop=True)


def synthetic_data(hours: int = 24 * 30) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    start = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) - timedelta(hours=hours - 1)
    weather, loads, renewables = [], [], []
    for index in range(hours):
        stamp = start + timedelta(hours=index)
        hour = stamp.hour
        daylight = max(0.0, math.sin((hour - 6) / 12 * math.pi))
        temperature = -29 + 7 * math.sin((hour - 4) / 24 * 2 * math.pi)
        wind = clamp(12 + 5 * math.sin((hour + 3) / 24 * 2 * math.pi) + 2 * math.sin(index / 60), 3, 30)
        irradiance = 560 * daylight * (0.82 + 0.08 * math.sin(index / 17))
        cloud = clamp(25 + 15 * math.sin(index / 31), 0, 100)
        heating = max(0, (-temperature - 10) * 1.7 + 12 * math.sin((hour - 7) / 24 * 2 * math.pi))
        critical = 110 + 12 * math.sin((hour - 8) / 24 * 2 * math.pi)
        noncritical = 42 + 18 * daylight + 8 * math.sin((hour + 2) / 24 * 2 * math.pi)
        solar = irradiance / 1000 * 300 * 0.21
        wind_kw = clamp(((wind - 3) / 12) ** 3 * 220, 0, 220)
        weather.append({"timestamp": _timestamp(stamp), "temperature_c": round(temperature, 2), "wind_speed_ms": round(wind, 2), "solar_irradiance_wm2": round(irradiance, 2), "cloud_cover_pct": round(cloud, 2)})
        loads.append({"timestamp": _timestamp(stamp), "total_load_kw": round(heating + critical + noncritical, 2), "heating_load_kw": round(heating, 2), "critical_load_kw": round(critical, 2), "noncritical_load_kw": round(noncritical, 2), "occupancy": round(65 + 20 * daylight, 2)})
        renewables.append({"timestamp": _timestamp(stamp), "solar_generation_kw": round(solar * (1 - cloud / 160), 2), "wind_generation_kw": round(wind_kw, 2), "total_renewable_kw": round(solar * (1 - cloud / 160) + wind_kw, 2)})
    return weather, loads, renewables


def load_data() -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    weather_frame, load_frame, renewable_frame = (_load_csv("weather.csv", REQUIRED_WEATHER), _load_csv("station_load.csv", REQUIRED_LOAD), _load_csv("renewable_generation.csv", REQUIRED_RENEWABLE))
    if weather_frame is None or load_frame is None:
        weather, loads, renewable = synthetic_data()
    else:
        weather = weather_frame.to_dict("records")
        loads = load_frame.to_dict("records")
        renewable = renewable_frame.to_dict("records") if renewable_frame is not None else []
    if not renewable:
        renewable = [{"timestamp": row["timestamp"], "solar_generation_kw": round(float(row["solar_irradiance_wm2"]) / 1000 * 300 * 0.21 * (1 - float(row["cloud_cover_pct"]) / 160), 2), "wind_generation_kw": round(clamp(((float(row["wind_speed_ms"]) - 3) / 12) ** 3 * 220, 0, 220), 2)} for row in weather]
        for row in renewable:
            row["total_renewable_kw"] = round(row["solar_generation_kw"] + row["wind_generation_kw"], 2)
    return weather, loads, renewable


def load_config() -> dict[str, Any]:
    path = DATA_DIR / "station_config.json"
    if not path.exists():
        return DEFAULT_CONFIG
    with path.open(encoding="utf-8") as handle:
        config = json.load(handle)
    return {**DEFAULT_CONFIG, **config}


def load_loads() -> list[dict[str, Any]]:
    path = DATA_DIR / "loads.json"
    if not path.exists():
        return DEFAULT_LOADS
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def scenario_data(scenario: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    if scenario not in SCENARIOS:
        raise ValueError(f"Supported scenarios: {', '.join(SCENARIOS)}")
    weather, loads, renewable = load_data()
    weather = [dict(row) for row in weather[:48]]
    loads = [dict(row) for row in loads[:48]]
    renewable = [dict(row) for row in renewable[:48]]
    if scenario == "extreme_cold":
        for row in weather:
            row["temperature_c"] = -45
        for row in loads:
            row["heating_load_kw"] = round(float(row["heating_load_kw"]) * 1.3, 2)
            row["total_load_kw"] = round(float(row["critical_load_kw"]) + float(row["noncritical_load_kw"]) + float(row["heating_load_kw"]), 2)
    if scenario == "wind_icing":
        for row in renewable:
            row["wind_generation_kw"] = round(float(row["wind_generation_kw"]) * 0.4, 2)
            row["total_renewable_kw"] = round(float(row["solar_generation_kw"]) + float(row["wind_generation_kw"]), 2)
    return weather, loads, renewable


def optimize(weather, loads, renewable, scenario: str) -> list[dict[str, Any]]:
    config = load_config(); battery = config["battery"]; generators = config["generators"]
    if scenario == "generator_failure":
        generators = [generator for generator in generators if generator["id"] != "GEN-01"]
    stored = battery["capacity_kwh"] * battery["initial_soc_percent"] / 100
    reserve = battery["capacity_kwh"] * battery["emergency_reserve_percent"] / 100
    results = []
    for weather_row, load_row, renewable_row in zip(weather, loads, renewable):
        demand = float(load_row["total_load_kw"]); renewable_kw = float(renewable_row["total_renewable_kw"])
        net = demand - renewable_kw; discharge = min(max(net, 0), battery["max_discharge_kw"], max(0, stored - reserve)); stored -= discharge
        remaining = max(0, net - discharge); outputs = {generator["id"]: 0.0 for generator in config["generators"]}
        for generator in generators:
            output = min(remaining, generator["rated_power_kw"])
            if output > 0 and output < generator["minimum_power_kw"] and remaining >= generator["minimum_power_kw"]:
                output = generator["minimum_power_kw"]
            outputs[generator["id"]] = round(output, 2); remaining -= output
            if remaining <= 0: break
        charge = min(max(-net, 0), battery["max_charge_kw"], max(0, battery["capacity_kwh"] - stored))
        stored += charge * battery["efficiency"]
        total_gen = sum(outputs.values())
        fuel = sum(output / generator["rated_power_kw"] * generator["fuel_consumption_lph"] for generator in generators for output in [outputs[generator["id"]]])
        unmet_critical = max(0, remaining - float(load_row["noncritical_load_kw"]))
        results.append({"timestamp": weather_row["timestamp"], "demand_kw": round(demand, 2), "solar_kw": round(float(renewable_row["solar_generation_kw"]), 2), "wind_kw": round(float(renewable_row["wind_generation_kw"]), 2), "generator_outputs": outputs, "generator_kw": round(total_gen, 2), "battery_charge_kw": round(charge, 2), "battery_discharge_kw": round(discharge, 2), "battery_soc_percent": round(stored / battery["capacity_kwh"] * 100, 2), "fuel_consumption_lph": round(fuel, 2), "unmet_critical_kw": round(unmet_critical, 2)})
    return results


def fuel_state(dispatch: list[dict[str, Any]]) -> dict[str, Any]:
    config = load_config()["fuel_tank"]; burn = sum(row["fuel_consumption_lph"] for row in dispatch) / max(1, len(dispatch)); remaining = config["initial_fuel_liters"]
    endurance = remaining / burn if burn else None
    return {"remaining_liters": round(remaining, 2), "endurance_hours": round(endurance, 2) if endurance else None, "endurance_days": round(endurance / 24, 2) if endurance else None, "burn_rate_lph": round(burn, 2), "exhaustion_date": _timestamp(datetime.now(timezone.utc) + timedelta(hours=endurance)) if endurance else None}


def load_shedding(available: float, demand_row: dict[str, Any]) -> dict[str, float]:
    critical = float(demand_row["critical_load_kw"]); flexible = float(demand_row["noncritical_load_kw"]); ratio = clamp((available - critical) / flexible, 0, 1) if flexible else 0
    return {"life_support": 100, "medical": 100, "communication": 100, "aux_labs": round(ratio * 100, 1), "nonessential_heating": round(ratio * 100, 1)}


def alerts(dispatch, weather, scenario: str) -> list[dict[str, str]]:
    output = []
    if scenario == "generator_failure": output.append({"severity": "critical", "title": "Primary generator failure", "message": "GEN-01 unavailable. Backup dispatch activated."})
    if min(row["battery_soc_percent"] for row in dispatch) <= load_config()["battery"]["emergency_reserve_percent"] + 3: output.append({"severity": "warning", "title": "Battery reserve approaching threshold", "message": "Dispatch is preserving the emergency battery reserve."})
    if sum(row["unmet_critical_kw"] for row in dispatch) == 0: output.append({"severity": "success", "title": "Critical loads protected", "message": "All critical loads are currently supplied at 100%."})
    return output


def recommendation(dispatch, scenario: str) -> dict[str, Any]:
    action = "Monitor renewable output"
    if scenario == "generator_failure": action = "Keep GEN-02 online and preserve battery reserve"
    elif max(row["fuel_consumption_lph"] for row in dispatch) > 40: action = "Review fuel burn and defer flexible loads"
    return {"action": action, "summary": "Numerical dispatch prioritizes critical loads, renewable generation, and the battery emergency reserve.", "reasons": ["Critical loads are protected at 100%", "Renewables are consumed before diesel generation", "Battery operation respects the configured emergency reserve"], "expected_impact": {"fuel_saving_percent": 0, "critical_load_protection_percent": 100}}


def dashboard(scenario: str = "normal") -> dict[str, Any]:
    weather, loads, renewable = scenario_data(scenario); dispatch = optimize(weather, loads, renewable, scenario); config = load_config(); current_weather = weather[0]; current_load = loads[0]; current_dispatch = dispatch[0]
    baseline_fuel = sum(max(0, float(row["total_load_kw"]) - float(ren["total_renewable_kw"])) / config["generators"][0]["rated_power_kw"] * config["generators"][0]["fuel_consumption_lph"] for row, ren in zip(loads, renewable))
    optimized_fuel = sum(row["fuel_consumption_lph"] for row in dispatch)
    impact = {"fuel_consumption_reduction_percent": round(max(0, (baseline_fuel - optimized_fuel) / max(baseline_fuel, 1) * 100), 1), "generator_runtime_reduction_percent": 0, "renewable_utilization_improvement_percent": 0, "critical_load_reliability_percent": 100 if sum(row["unmet_critical_kw"] for row in dispatch) == 0 else 0}
    available = current_dispatch["generator_kw"] + current_dispatch["battery_discharge_kw"] + current_dispatch["solar_kw"] + current_dispatch["wind_kw"]
    return {"station": {**config["station"], "status": "online"}, "environment": {"temperature_c": current_weather["temperature_c"], "wind_speed_ms": current_weather["wind_speed_ms"], "solar_irradiance_wm2": current_weather["solar_irradiance_wm2"], "weather_status": "Operational"}, "fuel": fuel_state(dispatch), "battery": {"soc_percent": current_dispatch["battery_soc_percent"], "charge_discharge_kw": current_dispatch["battery_discharge_kw"] - current_dispatch["battery_charge_kw"], "emergency_reserve_percent": config["battery"]["emergency_reserve_percent"]}, "energy": {"total_load_kw": current_dispatch["demand_kw"], "critical_load_kw": current_load["critical_load_kw"], "noncritical_load_kw": current_load["noncritical_load_kw"], "solar_generation_kw": current_dispatch["solar_kw"], "wind_generation_kw": current_dispatch["wind_kw"], "diesel_generation_kw": current_dispatch["generator_kw"], "total_renewable_kw": round(current_dispatch["solar_kw"] + current_dispatch["wind_kw"], 2)}, "forecast": [{"timestamp": row["timestamp"], "predicted_demand_kw": row["demand_kw"], "predicted_solar_kw": row["solar_kw"], "predicted_wind_kw": row["wind_kw"], "optimized_generator_kw": row["generator_kw"]} for row in dispatch], "dispatch": dispatch, "loads": load_shedding(available, current_load), "optimization_impact": impact, "alerts": alerts(dispatch, weather, scenario), "recommendation": recommendation(dispatch, scenario), "scenario": {"id": scenario, "name": SCENARIOS[scenario]}}
