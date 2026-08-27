import { Scenario, StationData } from "@/types/station";

export const baseStationData: StationData = {
  station: {
    name: "MAITRI",
    location: "Antarctica (70.76S, 11.73E)",
    systemStatus: "ONLINE",
    lastUpdated: "10:42:18"
  },
  environment: {
    temperatureC: -32,
    windSpeedMs: 10.5,
    solarIrradianceWm2: 214,
    weatherStatus: "Blizzard Warning"
  },
  fuel: {
    remainingLiters: 84200,
    enduranceDays: 18.7,
    burnRateLph: 6.4,
    exhaustionDate: "14 Sep 2026"
  },
  battery: {
    socPercent: 78,
    chargeDischargeKw: 12,
    isCharging: true,
    emergencyReservePercent: 30
  },
  energy: {
    totalLoadKw: 184,
    criticalLoadKw: 126,
    nonCriticalLoadKw: 58,
    solarGenerationKw: 91,
    windGenerationKw: 54,
    dieselGenerationKw: 51
  },
  generators: [
    { id: "GEN-01", name: "Primary Diesel Gen", status: "ON", loadKw: 51 },
    { id: "GEN-02", name: "Secondary Backup Gen", status: "OFF", loadKw: 0 }
  ],
  forecast: [
    { timeOffset: "Now", demandKw: 184, renewableKw: 145, generatorKw: 51, batterySoc: 78 },
    { timeOffset: "+6h", demandKw: 210, renewableKw: 110, generatorKw: 100, batterySoc: 72 },
    { timeOffset: "+12h", demandKw: 235, renewableKw: 60, generatorKw: 145, batterySoc: 64 },
    { timeOffset: "+18h", demandKw: 220, renewableKw: 40, generatorKw: 150, batterySoc: 55 },
    { timeOffset: "+24h", demandKw: 195, renewableKw: 85, generatorKw: 110, batterySoc: 58 },
    { timeOffset: "+30h", demandKw: 180, renewableKw: 130, generatorKw: 50, batterySoc: 65 },
    { timeOffset: "+36h", demandKw: 175, renewableKw: 160, generatorKw: 15, batterySoc: 74 },
    { timeOffset: "+42h", demandKw: 190, renewableKw: 120, generatorKw: 70, batterySoc: 76 },
    { timeOffset: "+48h", demandKw: 184, renewableKw: 145, generatorKw: 39, batterySoc: 78 }
  ],
  loads: [
    { id: "1", name: "Life Support", category: "CRITICAL", powerKw: 64, currentPercent: 100, minimumPercent: 100, sheddable: false },
    { id: "2", name: "Medical Facility", category: "CRITICAL", powerKw: 38, currentPercent: 100, minimumPercent: 100, sheddable: false },
    { id: "3", name: "Communication Array", category: "CRITICAL", powerKw: 24, currentPercent: 100, minimumPercent: 100, sheddable: false },
    { id: "4", name: "Auxiliary Labs", category: "NON-CRITICAL", powerKw: 34, currentPercent: 72, minimumPercent: 50, sheddable: true },
    { id: "5", name: "Non-essential Heating", category: "NON-CRITICAL", powerKw: 24, currentPercent: 65, minimumPercent: 40, sheddable: true }
  ],
  optimizationImpact: {
    fuelConsumptionReductionPercent: 12.8,
    generatorRuntimeReductionPercent: 18.4,
    renewableUtilizationImprovementPercent: 24.7,
    criticalLoadReliabilityPercent: 100
  },
  recommendation: {
    action: "START GENERATOR 2 AT 04:00",
    reasoning: [
      "Heating demand expected to increase 23% overnight due to ambient temperature drop",
      "Solar generation expected to decrease during polar night cycle",
      "Battery must remain above 30% emergency reserve threshold",
      "Starting GEN-02 in parallel reduces peak diesel wear and fuel thermal efficiency loss"
    ],
    fuelSavingPercent: 11.8,
    criticalLoadProtectionPercent: 100
  },
  alerts: [
    { id: "a1", severity: "warning", message: "Heating demand rising: expected +23% overnight", timestamp: "10:38" },
    { id: "a2", severity: "warning", message: "Battery reserve watch: projected to reach 34% at 03:00", timestamp: "10:15" },
    { id: "a3", severity: "success", message: "Critical loads fully protected under current dispatch", timestamp: "09:50" }
  ]
};

export function getScenarioData(scenario: Scenario): StationData {
  const data = structuredClone(baseStationData);

  switch (scenario) {
    case "extreme_cold":
      data.environment.temperatureC = -45;
      data.environment.weatherStatus = "Severe Deep Freeze";
      data.fuel.enduranceDays = 14.2;
      data.fuel.burnRateLph = 8.1;
      data.battery.socPercent = 68;
      data.battery.isCharging = false;
      data.battery.chargeDischargeKw = 0;
      data.energy.totalLoadKw = 230;
      data.energy.criticalLoadKw = 130;
      data.energy.nonCriticalLoadKw = 100;
      data.energy.dieselGenerationKw = 85;
      data.generators[0].loadKw = 39;
      data.generators[1].status = "ON";
      data.generators[1].loadKw = 46;
      data.recommendation.action = "PARALLEL DUAL-GENERATOR OPERATION MANDATORY";
      data.recommendation.reasoning = [
        "Ambient temperature dropped to -45 deg C, increasing structural thermal load",
        "Auxiliary heating active across all station modules",
        "Dispatching GEN-02 prevents single-unit overload"
      ];
      data.alerts.unshift({
        id: "ec1",
        severity: "critical",
        message: "Extreme cold alert: thermal draw spike detected",
        timestamp: "Just now"
      });
      break;
    case "wind_icing":
      data.environment.windSpeedMs = 4.2;
      data.environment.weatherStatus = "Blade Icing Condition";
      data.energy.windGenerationKw = 12;
      data.energy.solarGenerationKw = 45;
      data.energy.dieselGenerationKw = 109;
      data.battery.socPercent = 61;
      data.battery.isCharging = false;
      data.battery.chargeDischargeKw = 0;
      data.generators[1].status = "ON";
      data.generators[1].loadKw = 58;
      data.recommendation.action = "ACTIVATE TURBINE DE-ICING HEATERS AND SHED LAB LOADS";
      data.recommendation.reasoning = [
        "Wind turbine aerodynamic stall from ice accretion on blades",
        "Renewable contribution dropped by 65%",
        "Shedding non-essential lab allocation maintains 30% battery reserve floor"
      ];
      data.loads[3].currentPercent = 50;
      data.alerts.unshift({
        id: "wi1",
        severity: "critical",
        message: "Wind turbine efficiency degraded by 78% due to ice buildup",
        timestamp: "Just now"
      });
      break;
    case "generator_failure":
      data.generators[0].status = "FAILED";
      data.generators[0].loadKw = 0;
      data.generators[1].status = "ON";
      data.generators[1].loadKw = 39;
      data.fuel.enduranceDays = 16.9;
      data.battery.socPercent = 64;
      data.battery.isCharging = false;
      data.battery.chargeDischargeKw = 0;
      data.energy.dieselGenerationKw = 39;
      data.recommendation.action = "GEN-01 FAULT ISOLATED: GEN-02 SUPPLYING GRID DEFICIT";
      data.recommendation.reasoning = [
        "Primary diesel generator trip detected on oil pressure differential",
        "Secondary backup generator auto-started successfully in 8.4 seconds",
        "Shedding auxiliary non-essential circuits stabilizes microgrid frequency"
      ];
      data.loads[3].currentPercent = 50;
      data.loads[4].currentPercent = 40;
      data.alerts.unshift({
        id: "gf1",
        severity: "critical",
        message: "PRIMARY GENERATOR GEN-01 FAILURE - emergency backup active",
        timestamp: "Just now"
      });
      break;
    case "normal":
    default:
      break;
  }

  return data;
}
