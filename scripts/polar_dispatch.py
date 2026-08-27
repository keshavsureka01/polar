#!/usr/bin/env python3
"""Synthetic POLAR-E dispatch run for CLI experimentation."""

from __future__ import annotations

import math
from dataclasses import dataclass


BATTERY_CAPACITY_KWH = 520
BATTERY_MAX_KW = 170
DIESEL_MAX_KW = 290
FUEL_LITERS_PER_KWH = 0.27


@dataclass(frozen=True)
class Scenario:
    blizzard: bool = False
    generator_failure: bool = False
    initial_soc: float = 74
    load_bias: float = 0
    reserve_target: float = 28


def clamp(value: float, low: float, high: float) -> float:
    return min(high, max(low, value))


def wave(hour: int, phase: float = 0) -> float:
    return math.sin(((hour + phase) / 24) * math.pi * 2)


def forecast(scenario: Scenario) -> list[dict[str, float | str]]:
    points: list[dict[str, float | str]] = []
    for hour in range(24):
        daylight = clamp(math.sin(((hour - 6) / 12) * math.pi), 0, 1)
        storm_drag = 0.42 if scenario.blizzard else 1
        demand_pressure = 1 + scenario.load_bias / 100
        wind_speed = clamp(17 + 7 * wave(hour, 2) + (20 if scenario.blizzard else 0), 5, 44)
        solar_kw = round(105 * daylight * (0.2 if scenario.blizzard else 0.78))
        wind_kw = round(clamp((wind_speed - 4) * 8.8, 0, 205) * storm_drag)
        critical_kw = round((178 + 16 * wave(hour, 9) + (34 if scenario.blizzard else 0)) * demand_pressure)
        flexible_kw = round((48 + 24 * daylight + 10 * wave(hour, 15)) * demand_pressure)
        points.append(
            {
                "hour": f"{hour:02d}:00",
                "renewable_kw": solar_kw + wind_kw,
                "demand_kw": critical_kw + flexible_kw,
                "critical_kw": critical_kw,
                "flexible_kw": flexible_kw,
            }
        )
    return points


def dispatch(scenario: Scenario) -> list[dict[str, float | str]]:
    stored_kwh = clamp(scenario.initial_soc, 5, 100) / 100 * BATTERY_CAPACITY_KWH
    reserve_kwh = scenario.reserve_target / 100 * BATTERY_CAPACITY_KWH
    diesel_cap = DIESEL_MAX_KW / 2 if scenario.generator_failure else DIESEL_MAX_KW
    results: list[dict[str, float | str]] = []

    for point in forecast(scenario):
        net_demand = float(point["demand_kw"]) - float(point["renewable_kw"])
        diesel_kw = battery_kw = unmet_critical = 0.0
        if net_demand > 0:
            battery_kw = min(net_demand, clamp(stored_kwh - reserve_kwh, 0, BATTERY_MAX_KW))
            stored_kwh -= battery_kw
            diesel_kw = min(net_demand - battery_kw, diesel_cap)
            uncovered = net_demand - battery_kw - diesel_kw
            unmet_critical = max(0, uncovered - float(point["flexible_kw"]))
        else:
            charge_kw = min(abs(net_demand), clamp(BATTERY_CAPACITY_KWH - stored_kwh, 0, BATTERY_MAX_KW))
            battery_kw = -charge_kw
            stored_kwh += charge_kw * 0.92

        results.append(
            {
                **point,
                "diesel_kw": round(diesel_kw),
                "battery_kw": round(battery_kw),
                "soc": round(stored_kwh / BATTERY_CAPACITY_KWH * 100),
                "unmet_critical_kw": round(unmet_critical),
                "fuel_liters": round(diesel_kw * FUEL_LITERS_PER_KWH),
            }
        )
    return results


if __name__ == "__main__":
    scenario = Scenario(blizzard=True, generator_failure=True, initial_soc=65, load_bias=12, reserve_target=35)
    rows = dispatch(scenario)
    print("hour  demand  renew  diesel  battery  soc  fuel  unmet")
    for row in rows:
        print(
            f"{row['hour']:>5} {row['demand_kw']:>7} {row['renewable_kw']:>6} "
            f"{row['diesel_kw']:>7} {row['battery_kw']:>8} {row['soc']:>4}% "
            f"{row['fuel_liters']:>5}L {row['unmet_critical_kw']:>6}"
        )
