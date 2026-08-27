import { getScenarioData } from "@/simulation/scenarios";
import type { Scenario } from "@/types/station";

export const dynamic = "force-dynamic";

const scenarios: Scenario[] = ["normal", "extreme_cold", "wind_icing", "generator_failure"];

export async function POST(request: Request) {
  const body = (await request.json()) as { scenario?: Scenario };
  const scenario = body.scenario ?? "normal";

  if (!scenarios.includes(scenario)) {
    return Response.json({ error: "Unsupported simulation scenario" }, { status: 400 });
  }

  const backendUrl = process.env.POLAR_BACKEND_URL ||
    (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : "");

  if (backendUrl) {
    try {
      const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/simulation/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
        cache: "no-store",
        signal: AbortSignal.timeout(3500)
      });
      if (response.ok) {
        return Response.json({ source: "fastapi", dashboard: await response.json() });
      }
    } catch {
      // The local deterministic engine keeps the deployed dashboard operational.
    }
  }

  return Response.json({ source: "typescript", stationData: getScenarioData(scenario) });
}
