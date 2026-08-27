import { getScenarioData } from "@/simulation/scenarios";
import { AutomationDecision, DeviceConfig, LiveWeather } from "@/types/live";
import { StationData, SystemAlert } from "@/types/station";

export function buildLiveStationData(weather: LiveWeather, decision: AutomationDecision, deviceConfig: DeviceConfig): StationData {
  const data = getScenarioData(decision.triggeredAlerts.some((alert) => alert.severity === "critical") ? "extreme_cold" : "normal");
  const current = weather.current;
  const irradiance = Math.max(0, current.shortwaveRadiationWm2);
  const solarGenerationKw = Math.round((irradiance / 1000) * 180 * (decision.solarOutputTargetPercent / 100));
  const windGenerationKw = Math.round(Math.min(160, Math.max(0, Math.pow(current.windSpeedKmh / 36, 2.1) * 42)));
  const weatherLoadPenalty = current.temperatureC < 0 ? Math.abs(current.temperatureC) * 1.4 : current.temperatureC > 32 ? (current.temperatureC - 32) * 2.2 : 0;
  const criticalLoadKw = Math.round(126 + Math.min(58, weatherLoadPenalty));
  const nonCriticalLoadKw = Math.round(58 * (decision.nonCriticalLoadLimitPercent / 100));
  const totalLoadKw = criticalLoadKw + nonCriticalLoadKw;
  const dieselGenerationKw =
    decision.generator1Command === "ON" && decision.generator2Command === "ON"
      ? Math.max(40, totalLoadKw - solarGenerationKw - windGenerationKw)
      : decision.generator1Command === "ON" || decision.generator2Command === "ON"
        ? Math.max(20, totalLoadKw - solarGenerationKw - windGenerationKw)
        : 0;

  data.station.name = weather.location.name.toUpperCase();
  data.station.location = [weather.location.admin1, weather.location.country].filter(Boolean).join(", ") || `${weather.location.latitude}, ${weather.location.longitude}`;
  data.station.lastUpdated = new Date(weather.fetchedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  data.environment.temperatureC = Math.round(current.temperatureC);
  data.environment.windSpeedMs = current.windSpeedKmh / 3.6;
  data.environment.solarIrradianceWm2 = Math.round(irradiance);
  data.environment.weatherStatus = current.weatherLabel;
  data.battery.emergencyReservePercent = decision.batteryReserveTargetPercent;
  data.battery.socPercent = Math.max(decision.batteryReserveTargetPercent + 6, data.battery.socPercent - (dieselGenerationKw === 0 ? 8 : 0));
  data.battery.isCharging = solarGenerationKw + windGenerationKw > totalLoadKw;
  data.battery.chargeDischargeKw = data.battery.isCharging
    ? Math.min(80, solarGenerationKw + windGenerationKw - totalLoadKw)
    : -Math.min(80, totalLoadKw - solarGenerationKw - windGenerationKw - dieselGenerationKw);
  data.energy = {
    totalLoadKw,
    criticalLoadKw,
    nonCriticalLoadKw,
    solarGenerationKw,
    windGenerationKw,
    dieselGenerationKw
  };
  data.generators = [
    {
      id: "GEN-01",
      name: "Primary Diesel Gen",
      status: decision.generator1Command,
      loadKw: decision.generator1Command === "ON" ? Math.round(dieselGenerationKw * (decision.generator2Command === "ON" ? 0.54 : 1)) : 0
    },
    {
      id: "GEN-02",
      name: "Secondary Backup Gen",
      status: decision.generator2Command,
      loadKw: decision.generator2Command === "ON" ? Math.round(dieselGenerationKw * (decision.generator1Command === "ON" ? 0.46 : 1)) : 0
    }
  ];
  data.forecast = buildForecast(weather, deviceConfig);
  data.loads = data.loads.map((load) =>
    load.category === "CRITICAL"
      ? { ...load, currentPercent: 100 }
      : { ...load, currentPercent: Math.max(load.minimumPercent, decision.nonCriticalLoadLimitPercent) }
  );
  data.recommendation.action =
    decision.generator1Command === "ON" || decision.generator2Command === "ON"
      ? "AUTOMATION DISPATCH: GENERATOR SUPPORT ACTIVE"
      : "AUTOMATION DISPATCH: RENEWABLE-FIRST STANDBY";
  data.recommendation.reasoning = decision.rationale;
  data.recommendation.criticalLoadProtectionPercent = decision.criticalLoadProtectionPercent;
  data.recommendation.fuelSavingPercent = Math.max(4, Math.round((100 - decision.solarOutputTargetPercent / 1.7) * 10) / 10);
  data.alerts = [
    ...decision.triggeredAlerts.map<SystemAlert>((alert) => ({
      id: alert.id,
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.timestamp
    })),
    {
      id: "live-weather",
      severity: "info",
      message: `Live Open-Meteo feed synchronized for ${weather.location.name}`,
      timestamp: data.station.lastUpdated
    },
    {
      id: "provider",
      severity: decision.providerStatus === "demo-ready" ? "warning" : "success",
      message:
        decision.providerStatus === "demo-ready"
          ? "Hardware provider in demo mode; connect gateway credentials to actuate real devices"
          : "Hardware provider configured; command payload ready for gateway dispatch",
      timestamp: data.station.lastUpdated
    }
  ];

  return data;
}

function buildForecast(weather: LiveWeather, deviceConfig: DeviceConfig) {
  return weather.hourly.slice(0, 49).filter((_, index) => index % 6 === 0).map((hour, index) => {
    const solarKw = Math.round((Math.max(0, hour.shortwaveRadiationWm2) / 1000) * 180 * (deviceConfig.solarOutputTargetPercent / 100));
    const windKw = Math.round(Math.min(160, Math.max(0, Math.pow(hour.windSpeedKmh / 36, 2.1) * 42)));
    const demandKw = Math.round(170 + (hour.temperatureC < 0 ? Math.abs(hour.temperatureC) * 1.25 : 0) + hour.precipitationProbability * 0.18);
    const renewableKw = solarKw + windKw;

    return {
      timeOffset: index === 0 ? "Now" : `+${index * 6}h`,
      demandKw,
      renewableKw,
      generatorKw: Math.max(0, demandKw - renewableKw),
      batterySoc: Math.max(deviceConfig.batteryReserveTargetPercent, 78 - index * 4)
    };
  });
}
