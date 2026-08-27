import { getScenarioData } from "@/simulation/scenarios";
import { Scenario, StationData } from "@/types/station";

export async function fetchStationData(scenario: Scenario = "normal"): Promise<StationData> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(getScenarioData(scenario)), 150);
  });
}
