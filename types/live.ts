export interface LocationResult {
  id: number | string;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface WeatherHour {
  time: string;
  temperatureC: number;
  apparentTemperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  precipitationMm: number;
  precipitationProbability: number;
  cloudCoverPercent: number;
  shortwaveRadiationWm2: number;
  weatherCode: number;
}

export interface LiveWeather {
  location: LocationResult;
  fetchedAt: string;
  current: WeatherHour & {
    windDirectionDeg: number;
    isDay: boolean;
    weatherLabel: string;
  };
  hourly: WeatherHour[];
}

export type WeatherMetric =
  | "temperatureC"
  | "apparentTemperatureC"
  | "humidityPercent"
  | "windSpeedKmh"
  | "precipitationMm"
  | "precipitationProbability"
  | "cloudCoverPercent"
  | "shortwaveRadiationWm2";

export type AlertOperator = "below" | "above";

export type AlertAction = "start_generator" | "stop_generator" | "shed_noncritical" | "limit_solar" | "raise_notice";

export interface AlertRule {
  id: string;
  label: string;
  metric: WeatherMetric;
  operator: AlertOperator;
  threshold: number;
  severity: "critical" | "warning" | "info" | "success";
  action: AlertAction;
  enabled: boolean;
}

export interface TriggeredAlert {
  id: string;
  ruleId: string;
  severity: AlertRule["severity"];
  message: string;
  action: AlertAction;
  timestamp: string;
}

export interface DeviceConfig {
  generatorMode: "auto" | "manual";
  generator1Enabled: boolean;
  generator2Enabled: boolean;
  solarMode: "auto" | "manual";
  solarOutputTargetPercent: number;
  batteryReserveTargetPercent: number;
  nonCriticalLoadLimitPercent: number;
  hardwareProvider: "demo" | "modbus" | "mqtt" | "rest";
  endpointUrl: string;
}

export interface AutomationDecision {
  generator1Command: "ON" | "OFF";
  generator2Command: "ON" | "OFF";
  solarOutputTargetPercent: number;
  batteryReserveTargetPercent: number;
  nonCriticalLoadLimitPercent: number;
  triggeredAlerts: TriggeredAlert[];
  rationale: string[];
  criticalLoadProtectionPercent: number;
  providerStatus: "demo-ready" | "integration-ready";
  commandPayload: {
    provider: DeviceConfig["hardwareProvider"];
    endpointUrl?: string;
    commands: Record<string, string | number | boolean>;
  };
}

export const defaultAlertRules: AlertRule[] = [
  {
    id: "low-temp",
    label: "Extreme cold generator assist",
    metric: "temperatureC",
    operator: "below",
    threshold: -20,
    severity: "critical",
    action: "start_generator",
    enabled: true
  },
  {
    id: "low-solar",
    label: "Low irradiance reserve protection",
    metric: "shortwaveRadiationWm2",
    operator: "below",
    threshold: 120,
    severity: "warning",
    action: "shed_noncritical",
    enabled: true
  },
  {
    id: "high-wind",
    label: "High wind turbine protection",
    metric: "windSpeedKmh",
    operator: "above",
    threshold: 65,
    severity: "warning",
    action: "limit_solar",
    enabled: true
  }
];

export const defaultDeviceConfig: DeviceConfig = {
  generatorMode: "auto",
  generator1Enabled: true,
  generator2Enabled: false,
  solarMode: "auto",
  solarOutputTargetPercent: 92,
  batteryReserveTargetPercent: 30,
  nonCriticalLoadLimitPercent: 70,
  hardwareProvider: "demo",
  endpointUrl: ""
};
