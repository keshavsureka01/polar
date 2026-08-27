import { getWeatherCodeLabel } from "@/lib/weatherCodes";
import type { LiveWeather, LocationResult, WeatherHour } from "@/types/live";

export const dynamic = "force-dynamic";

interface OpenMeteoForecast {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    precipitation: number;
    precipitation_probability: number;
    cloud_cover: number;
    shortwave_radiation: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    precipitation: number[];
    precipitation_probability: number[];
    cloud_cover: number[];
    shortwave_radiation: number[];
    weather_code: number[];
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitude = Number(url.searchParams.get("latitude"));
  const longitude = Number(url.searchParams.get("longitude"));
  const name = url.searchParams.get("name") || "Selected Site";
  const country = url.searchParams.get("country") || "Custom coordinates";
  const admin1 = url.searchParams.get("admin1") || undefined;
  const elevation = Number(url.searchParams.get("elevation"));
  const timezone = url.searchParams.get("timezone") || "auto";

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return Response.json({ error: "Latitude must be between -90 and 90 and longitude between -180 and 180" }, { status: 400 });
  }

  const apiUrl = new URL("https://api.open-meteo.com/v1/forecast");
  apiUrl.searchParams.set("latitude", String(latitude));
  apiUrl.searchParams.set("longitude", String(longitude));
  apiUrl.searchParams.set(
    "current",
    [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "precipitation",
      "precipitation_probability",
      "cloud_cover",
      "shortwave_radiation",
      "is_day"
    ].join(",")
  );
  apiUrl.searchParams.set(
    "hourly",
    [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "wind_speed_10m",
      "precipitation",
      "precipitation_probability",
      "cloud_cover",
      "shortwave_radiation",
      "weather_code"
    ].join(",")
  );
  apiUrl.searchParams.set("forecast_hours", "72");
  apiUrl.searchParams.set("cell_selection", "land");
  apiUrl.searchParams.set("temperature_unit", "celsius");
  apiUrl.searchParams.set("wind_speed_unit", "kmh");
  if (Number.isFinite(elevation)) {
    apiUrl.searchParams.set("elevation", String(elevation));
  }
  apiUrl.searchParams.set("timezone", timezone);

  const response = await fetch(apiUrl, { cache: "no-store" });
  if (!response.ok) {
    return Response.json({ error: "Weather feed failed" }, { status: 502 });
  }

  const payload = (await response.json()) as OpenMeteoForecast;
  const location: LocationResult = {
    id: `${latitude},${longitude}`,
    name,
    country,
    admin1,
    latitude,
    longitude,
    elevation: Number.isFinite(elevation) ? elevation : undefined,
    timezone
  };
  const hourly = mapHourly(payload).slice(0, 72);
  const matchingHour = findClosestHour(hourly, payload.current.time) ?? hourly[0];

  const liveWeather: LiveWeather = {
    location,
    fetchedAt: new Date().toISOString(),
    source: "Open-Meteo",
    model: "Best Match",
    dataKind: "forecast-model",
    current: {
      ...matchingHour,
      time: payload.current.time,
      temperatureC: payload.current.temperature_2m,
      apparentTemperatureC: payload.current.apparent_temperature,
      humidityPercent: payload.current.relative_humidity_2m,
      windSpeedKmh: payload.current.wind_speed_10m,
      precipitationMm: payload.current.precipitation,
      precipitationProbability: payload.current.precipitation_probability,
      cloudCoverPercent: payload.current.cloud_cover,
      shortwaveRadiationWm2: payload.current.shortwave_radiation,
      weatherCode: payload.current.weather_code,
      windDirectionDeg: payload.current.wind_direction_10m,
      isDay: payload.current.is_day === 1,
      weatherLabel: getWeatherCodeLabel(payload.current.weather_code)
    },
    hourly
  };

  return Response.json(liveWeather);
}

function mapHourly(payload: OpenMeteoForecast): WeatherHour[] {
  return payload.hourly.time.map((time, index) => ({
    time,
    temperatureC: payload.hourly.temperature_2m[index] ?? 0,
    apparentTemperatureC: payload.hourly.apparent_temperature[index] ?? 0,
    humidityPercent: payload.hourly.relative_humidity_2m[index] ?? 0,
    windSpeedKmh: payload.hourly.wind_speed_10m[index] ?? 0,
    precipitationMm: payload.hourly.precipitation[index] ?? 0,
    precipitationProbability: payload.hourly.precipitation_probability[index] ?? 0,
    cloudCoverPercent: payload.hourly.cloud_cover[index] ?? 0,
    shortwaveRadiationWm2: payload.hourly.shortwave_radiation[index] ?? 0,
    weatherCode: payload.hourly.weather_code[index] ?? 0
  }));
}

function findClosestHour(hours: WeatherHour[], currentTime: string) {
  const currentHour = currentTime.slice(0, 13);
  return hours.find((hour) => hour.time.slice(0, 13) === currentHour);
}
