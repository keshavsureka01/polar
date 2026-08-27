import { fetchLiveWeather } from "@/services/liveApi";
import type { LiveWeather, LocationResult } from "@/types/live";

export interface PolarStation extends LocationResult {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  elevation: number;
}

export const POLAR_STATIONS: PolarStation[] = [
  { id: "maitri", name: "Maitri Station", country: "India", admin1: "Antarctica", latitude: -70.7658, longitude: 11.7342, elevation: 117, timezone: "auto" },
  { id: "mcmurdo", name: "McMurdo Station", country: "USA", admin1: "Antarctica", latitude: -77.8419, longitude: 166.6863, elevation: 24, timezone: "auto" },
  { id: "south_pole", name: "Amundsen-Scott South Pole", country: "USA", admin1: "Antarctica", latitude: -90, longitude: 0, elevation: 2835, timezone: "auto" },
  { id: "rothera", name: "Rothera Research Station", country: "UK", admin1: "Antarctica", latitude: -67.5681, longitude: -68.1228, elevation: 4, timezone: "auto" },
  { id: "troll", name: "Troll Station", country: "Norway", admin1: "Antarctica", latitude: -72.0112, longitude: 2.5322, elevation: 1275, timezone: "auto" }
];

export async function fetchLiveStationWeather(station: PolarStation): Promise<LiveWeather> {
  return fetchLiveWeather(station);
}
