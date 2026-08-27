import type { LocationResult } from "@/types/live";

export const dynamic = "force-dynamic";

interface OpenMeteoGeocodeResult {
  id: number;
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();

  if (!query) {
    return Response.json({ results: [] });
  }

  const apiUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  apiUrl.searchParams.set("name", query);
  apiUrl.searchParams.set("count", "8");
  apiUrl.searchParams.set("language", "en");
  apiUrl.searchParams.set("format", "json");

  const response = await fetch(apiUrl, { cache: "no-store" });
  if (!response.ok) {
    return Response.json({ error: "Location lookup failed" }, { status: 502 });
  }

  const payload = (await response.json()) as { results?: OpenMeteoGeocodeResult[] };
  const results: LocationResult[] = (payload.results ?? []).map((result) => ({
    id: result.id,
    name: result.name,
    country: result.country ?? "Unknown",
    admin1: result.admin1,
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone
  }));

  return Response.json({ results });
}
