import { AlertRule, AutomationDecision, DeviceConfig, LiveWeather, LocationResult } from "@/types/live";

export async function searchLocations(query: string): Promise<LocationResult[]> {
  const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || "Location search failed");
  }

  const payload = (await response.json()) as { results: LocationResult[] };
  return payload.results;
}

interface BigDataCloudLocation {
  latitude: number;
  longitude: number;
  locality?: string;
  city?: string;
  principalSubdivision?: string;
  countryName?: string;
}

export async function reverseGeocodeCurrentLocation(latitude: number, longitude: number): Promise<LocationResult> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: "en"
  });
  const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Current location lookup failed");
  }

  const payload = (await response.json()) as BigDataCloudLocation;
  return {
    id: `gps-${latitude.toFixed(5)},${longitude.toFixed(5)}`,
    name: payload.city || payload.locality || "Current Device Location",
    country: payload.countryName || "GPS coordinates",
    admin1: payload.principalSubdivision || undefined,
    latitude,
    longitude,
    timezone: "auto"
  };
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
  if (typeof location.elevation === "number") {
    params.set("elevation", String(location.elevation));
  }

  const response = await fetch(`/api/weather?${params.toString()}`);
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || "Live weather feed failed");
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
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || "Automation evaluation failed");
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
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || "Device command failed");
  }

  return (await response.json()) as {
    ok: boolean;
    providerStatus: "simulated" | "sent";
    sentAt: string;
    message: string;
  };
}
