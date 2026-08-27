export type Scenario = "normal" | "extreme_cold" | "wind_icing" | "generator_failure";

export interface ForecastPoint {
  timeOffset: string;
  demandKw: number;
  renewableKw: number;
  generatorKw: number;
  batterySoc: number;
}

export interface LoadItem {
  id: string;
  name: string;
  category: "CRITICAL" | "NON-CRITICAL";
  powerKw: number;
  currentPercent: number;
  minimumPercent: number;
  sheddable: boolean;
}

export interface SystemAlert {
  id: string;
  severity: "critical" | "warning" | "info" | "success";
  message: string;
  timestamp: string;
}

export interface StationData {
  station: {
    name: string;
    location: string;
    systemStatus: string;
    lastUpdated: string;
  };
  environment: {
    temperatureC: number;
    windSpeedMs: number;
    solarIrradianceWm2: number;
    weatherStatus: string;
  };
  fuel: {
    remainingLiters: number;
    enduranceDays: number;
    burnRateLph: number;
    exhaustionDate: string;
  };
  battery: {
    socPercent: number;
    chargeDischargeKw: number;
    isCharging: boolean;
    emergencyReservePercent: number;
  };
  energy: {
    totalLoadKw: number;
    criticalLoadKw: number;
    nonCriticalLoadKw: number;
    solarGenerationKw: number;
    windGenerationKw: number;
    dieselGenerationKw: number;
  };
  forecast: ForecastPoint[];
  loads: LoadItem[];
  optimizationImpact: {
    fuelConsumptionReductionPercent: number;
    generatorRuntimeReductionPercent: number;
    renewableUtilizationImprovementPercent: number;
    criticalLoadReliabilityPercent: number;
  };
  recommendation: {
    action: string;
    reasoning: string[];
    fuelSavingPercent: number;
    criticalLoadProtectionPercent: number;
  };
  alerts: SystemAlert[];
  generators: {
    id: string;
    name: string;
    status: "ON" | "OFF" | "FAILED";
    loadKw: number;
  }[];
}
