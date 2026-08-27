import { AlertRule, AutomationDecision, DeviceConfig, LiveWeather, LocationResult } from "@/types/live";

export async function searchLocations(query: string): Promise<LocationResult[]> {
  const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error("Location search failed");
  }

  const payload = (await response.json()) as { results: LocationResult[] };
  return payload.results;
}

export async function fetchLiveWeather(location: LocationResult): Promise<LiveWeather> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    name: location.name,
    country: location.country,
    timezone: location.timezone ?? "auto"
  });

  if (location.admin1) {
    params.set("admin1", location.admin1);
  }

  const response = await fetch(`/api/weather?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Live weather feed failed");
  }

  return (await response.json()) as LiveWeather;
}

export async function runAutomation(
  weather: LiveWeather,
  alertRules: AlertRule[],
  deviceConfig: DeviceConfig
): Promise<AutomationDecision> {
  const response = await fetch("/api/automation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ weather, alertRules, deviceConfig })
  });
  if (!response.ok) {
    throw new Error("Automation evaluation failed");
  }

  return (await response.json()) as AutomationDecision;
}

export async function sendDeviceCommand(decision: AutomationDecision, deviceConfig: DeviceConfig) {
  const response = await fetch("/api/devices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, deviceConfig })
  });
  if (!response.ok) {
    throw new Error("Device command failed");
  }

  return (await response.json()) as {
    ok: boolean;
    providerStatus: "simulated" | "queued";
    sentAt: string;
    message: string;
  };
}
