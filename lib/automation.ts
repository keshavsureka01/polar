import { AlertRule, AutomationDecision, DeviceConfig, LiveWeather, WeatherMetric } from "@/types/live";

const metricLabels: Record<WeatherMetric, string> = {
  temperatureC: "Temperature",
  apparentTemperatureC: "Feels-like temperature",
  humidityPercent: "Humidity",
  windSpeedKmh: "Wind speed",
  precipitationMm: "Precipitation",
  precipitationProbability: "Precipitation probability",
  cloudCoverPercent: "Cloud cover",
  shortwaveRadiationWm2: "Solar irradiance"
};

const metricUnits: Record<WeatherMetric, string> = {
  temperatureC: "deg C",
  apparentTemperatureC: "deg C",
  humidityPercent: "%",
  windSpeedKmh: "km/h",
  precipitationMm: "mm",
  precipitationProbability: "%",
  cloudCoverPercent: "%",
  shortwaveRadiationWm2: "W/m2"
};

export function evaluateAutomation(weather: LiveWeather, rules: AlertRule[], deviceConfig: DeviceConfig): AutomationDecision {
  const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const enabledRules = rules.filter((rule) => rule.enabled);
  const triggeredAlerts = enabledRules
    .filter((rule) => isTriggered(weather.current[rule.metric], rule.operator, rule.threshold))
    .map((rule) => ({
      id: `${rule.id}-${weather.fetchedAt}`,
      ruleId: rule.id,
      severity: rule.severity,
      message: `${rule.label}: ${metricLabels[rule.metric]} ${formatRule(rule.operator)} ${rule.threshold}${metricUnits[rule.metric]}`,
      action: rule.action,
      timestamp: now
    }));

  const severeWeather =
    weather.current.temperatureC <= -15 ||
    weather.current.windSpeedKmh >= 58 ||
    weather.current.precipitationProbability >= 70 ||
    weather.current.cloudCoverPercent >= 85;
  const lowSolar = weather.current.shortwaveRadiationWm2 < 140;
  const startGenerator = triggeredAlerts.some((alert) => alert.action === "start_generator") || (severeWeather && lowSolar);
  const shedLoad = triggeredAlerts.some((alert) => alert.action === "shed_noncritical") || (severeWeather && lowSolar);
  const limitSolar = triggeredAlerts.some((alert) => alert.action === "limit_solar");
  const generatorAuto = deviceConfig.generatorMode === "auto";
  const solarAuto = deviceConfig.solarMode === "auto";

  const generator1Command = generatorAuto
    ? startGenerator && deviceConfig.generator1Enabled
      ? "ON"
      : "OFF"
    : deviceConfig.generator1Enabled
      ? "ON"
      : "OFF";
  const generator2Command = generatorAuto
    ? startGenerator && deviceConfig.generator2Enabled
      ? "ON"
      : "OFF"
    : deviceConfig.generator2Enabled
      ? "ON"
      : "OFF";
  const solarOutputTargetPercent = solarAuto
    ? clamp(Math.round(limitSolar ? 72 : weather.current.shortwaveRadiationWm2 < 80 ? 45 : weather.current.cloudCoverPercent > 80 ? 68 : 96), 20, 100)
    : deviceConfig.solarOutputTargetPercent;
  const batteryReserveTargetPercent = clamp(
    severeWeather ? Math.max(deviceConfig.batteryReserveTargetPercent, 38) : deviceConfig.batteryReserveTargetPercent,
    15,
    80
  );
  const nonCriticalLoadLimitPercent = clamp(shedLoad ? Math.min(deviceConfig.nonCriticalLoadLimitPercent, 55) : deviceConfig.nonCriticalLoadLimitPercent, 30, 100);

  const rationale = [
    `${weather.location.name} live conditions: ${weather.current.weatherLabel}, ${Math.round(weather.current.temperatureC)} deg C, ${Math.round(weather.current.windSpeedKmh)} km/h wind.`,
    startGenerator
      ? "Generator assist is required by active alerts or combined severe-weather and low-solar conditions."
      : "Generator bank can remain in standby under current live weather and alert thresholds.",
    solarAuto
      ? `Solar output target set automatically from irradiance and cloud cover at ${solarOutputTargetPercent}%.`
      : `Solar output target is controlled manually at ${solarOutputTargetPercent}%.`,
    `Battery reserve target is held at ${batteryReserveTargetPercent}% for critical-load protection.`
  ];

  return {
    generator1Command,
    generator2Command,
    solarOutputTargetPercent,
    batteryReserveTargetPercent,
    nonCriticalLoadLimitPercent,
    triggeredAlerts,
    rationale,
    criticalLoadProtectionPercent: startGenerator || weather.current.shortwaveRadiationWm2 > 200 ? 100 : 98,
    providerStatus: deviceConfig.hardwareProvider === "demo" ? "demo-ready" : "integration-ready",
    commandPayload: {
      provider: deviceConfig.hardwareProvider,
      endpointUrl: deviceConfig.endpointUrl || undefined,
      commands: {
        generator1: generator1Command,
        generator2: generator2Command,
        solarOutputTargetPercent,
        batteryReserveTargetPercent,
        nonCriticalLoadLimitPercent,
        automationEnabled: generatorAuto || solarAuto
      }
    }
  };
}

function isTriggered(value: number, operator: "below" | "above", threshold: number) {
  return operator === "below" ? value < threshold : value > threshold;
}

function formatRule(operator: "below" | "above") {
  return operator === "below" ? "below" : "above";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
