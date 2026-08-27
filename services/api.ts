import { Scenario, StationData } from "@/types/station";
import { getScenarioData } from "@/simulation/scenarios";

type BackendDashboard = {
  station: { name: string; location: string; status: string };
  environment: { temperature_c: number; wind_speed_ms: number; solar_irradiance_wm2: number; weather_status: string };
  fuel: { remaining_liters: number; endurance_days: number | null; burn_rate_lph: number; exhaustion_date: string | null };
  battery: { soc_percent: number; charge_discharge_kw: number; emergency_reserve_percent: number };
  energy: { total_load_kw: number; critical_load_kw: number; noncritical_load_kw: number; solar_generation_kw: number; wind_generation_kw: number; diesel_generation_kw: number };
  forecast: { timestamp: string; predicted_demand_kw: number; predicted_solar_kw: number; predicted_wind_kw: number; optimized_generator_kw: number }[];
  loads: { id: string; name: string; category: "CRITICAL" | "NON-CRITICAL"; power_kw: number; current_percent: number; minimum_percent: number; sheddable: boolean }[];
  optimization_impact: { fuel_consumption_reduction_percent: number; generator_runtime_reduction_percent: number; renewable_utilization_improvement_percent: number; critical_load_reliability_percent: number };
  recommendation: { action: string; summary: string; reasons: string[]; expected_impact: { fuel_saving_percent: number; critical_load_protection_percent: number } };
  alerts: { severity: "critical" | "warning" | "info" | "success"; title?: string; message: string; timestamp?: string }[];
  generators: { id: string; name: string; status: "ON" | "OFF" | "FAILED"; load_kw: number }[];
};

type BackendBriefing = {
  source: "groq" | "deterministic";
  headline: string;
  situation: string;
  action: string;
  reasoning: string[];
  risk: string;
  tradeoff: string;
  summary: string;
  reasons: string[];
  expected_impact: { fuel_saving_percent?: number; critical_load_protection_percent?: number };
};

type BriefingRecommendation = Pick<StationData["recommendation"], "action" | "summary" | "situation" | "risk" | "tradeoff" | "source" | "reasoning" | "fuelSavingPercent" | "criticalLoadProtectionPercent">;

export async function fetchStationData(scenario: Scenario = "normal"): Promise<StationData> {
  try {
    const response = await fetch("/api/simulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario }),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`POLAR-E backend request failed: ${response.status}`);
    }

    const payload = await response.json() as {
      source: "fastapi" | "typescript";
      dashboard?: BackendDashboard;
      stationData?: StationData;
    };
    if (payload.stationData) {
      return payload.stationData;
    }
    if (payload.dashboard) {
      return mapDashboard(payload.dashboard);
    }
    throw new Error("Simulation backend returned no station data");
  } catch {
    console.warn("POLAR-E backend unavailable; using mock station fallback");
    return getScenarioData(scenario);
  }
}

export async function fetchAiBriefing(scenario: Scenario, baseline: StationData, scenarioState: StationData): Promise<BriefingRecommendation | null> {
  try {
    const response = await fetch("/api/ai-briefing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario, baseline, scenario_state: scenarioState }),
      cache: "no-store"
    });
    if (!response.ok) {
      throw new Error(`POLAR-E AI briefing failed: ${response.status}`);
    }
    const briefing = await response.json() as BackendBriefing;
    return {
      action: briefing.action,
      summary: briefing.situation || briefing.summary,
      situation: briefing.situation,
      risk: briefing.risk,
      tradeoff: briefing.tradeoff,
      source: briefing.source,
      reasoning: briefing.reasoning?.length ? briefing.reasoning : briefing.reasons,
      fuelSavingPercent: briefing.expected_impact.fuel_saving_percent ?? 0,
      criticalLoadProtectionPercent: briefing.expected_impact.critical_load_protection_percent ?? 100
    };
  } catch {
    console.warn("POLAR-E AI briefing unavailable; using numerical recommendation");
    return null;
  }
}

function mapDashboard(data: BackendDashboard): StationData {
  return {
    station: {
      name: data.station.name,
      location: data.station.location,
      systemStatus: data.station.status.toUpperCase(),
      lastUpdated: new Date().toISOString()
    },
    environment: {
      temperatureC: data.environment.temperature_c,
      windSpeedMs: data.environment.wind_speed_ms,
      solarIrradianceWm2: data.environment.solar_irradiance_wm2,
      weatherStatus: data.environment.weather_status
    },
    fuel: {
      remainingLiters: data.fuel.remaining_liters,
      enduranceDays: data.fuel.endurance_days ?? 0,
      burnRateLph: data.fuel.burn_rate_lph,
      exhaustionDate: data.fuel.exhaustion_date ?? "N/A"
    },
    battery: {
      socPercent: data.battery.soc_percent,
      chargeDischargeKw: Math.abs(data.battery.charge_discharge_kw),
      isCharging: data.battery.charge_discharge_kw < 0,
      emergencyReservePercent: data.battery.emergency_reserve_percent
    },
    energy: {
      totalLoadKw: data.energy.total_load_kw,
      criticalLoadKw: data.energy.critical_load_kw,
      nonCriticalLoadKw: data.energy.noncritical_load_kw,
      solarGenerationKw: data.energy.solar_generation_kw,
      windGenerationKw: data.energy.wind_generation_kw,
      dieselGenerationKw: data.energy.diesel_generation_kw
    },
    forecast: data.forecast.map((point, index) => ({
      timeOffset: index === 0 ? "Now" : `+${index}h`,
      demandKw: point.predicted_demand_kw,
      renewableKw: point.predicted_solar_kw + point.predicted_wind_kw,
      generatorKw: point.optimized_generator_kw,
      batterySoc: data.battery.soc_percent
    })),
    loads: data.loads.map((load) => ({
      id: load.id,
      name: load.name,
      category: load.category,
      powerKw: load.power_kw,
      currentPercent: load.current_percent,
      minimumPercent: load.minimum_percent,
      sheddable: load.sheddable
    })),
    optimizationImpact: {
      fuelConsumptionReductionPercent: data.optimization_impact.fuel_consumption_reduction_percent,
      generatorRuntimeReductionPercent: data.optimization_impact.generator_runtime_reduction_percent,
      renewableUtilizationImprovementPercent: data.optimization_impact.renewable_utilization_improvement_percent,
      criticalLoadReliabilityPercent: data.optimization_impact.critical_load_reliability_percent
    },
    recommendation: {
      action: data.recommendation.action,
      reasoning: data.recommendation.reasons,
      summary: data.recommendation.summary,
      situation: data.recommendation.summary,
      source: "deterministic",
      fuelSavingPercent: data.recommendation.expected_impact.fuel_saving_percent,
      criticalLoadProtectionPercent: data.recommendation.expected_impact.critical_load_protection_percent
    },
    alerts: data.alerts.map((alert, index) => ({
      id: `backend-alert-${index}`,
      severity: alert.severity,
      message: alert.title ? `${alert.title}: ${alert.message}` : alert.message,
      timestamp: alert.timestamp ?? "Just now"
    })),
    generators: data.generators.map((generator) => ({
      id: generator.id,
      name: generator.name,
      status: generator.status,
      loadKw: generator.load_kw
    }))
  };
}
