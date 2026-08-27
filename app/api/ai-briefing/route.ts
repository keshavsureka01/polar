import type { Scenario, StationData } from "@/types/station";

export const dynamic = "force-dynamic";

const scenarios: Scenario[] = ["normal", "extreme_cold", "wind_icing", "generator_failure"];

interface BriefingRequest {
  scenario?: Scenario;
  baseline?: StationData;
  scenario_state?: StationData;
}

export async function POST(request: Request) {
  const body = (await request.json()) as BriefingRequest;
  const scenario = body.scenario ?? "normal";

  if (!scenarios.includes(scenario) || !body.scenario_state) {
    return Response.json({ error: "A valid scenario and scenario_state are required" }, { status: 400 });
  }

  const backendUrl = process.env.POLAR_BACKEND_URL ||
    (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : "");
  if (backendUrl) {
    try {
      const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/ai/briefing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        return Response.json(await response.json());
      }
    } catch {
      // Use the numerical recommendation when the optional AI service is absent.
    }
  }

  const recommendation = body.scenario_state.recommendation;
  return Response.json({
    source: "deterministic",
    headline: recommendation.action,
    situation: recommendation.summary || recommendation.reasoning[0],
    action: recommendation.action,
    reasoning: recommendation.reasoning,
    risk: recommendation.risk || "Critical loads must remain protected while the scenario is active.",
    tradeoff: recommendation.tradeoff || "The response may increase diesel use or reduce fuel endurance.",
    summary: recommendation.summary || recommendation.reasoning[0],
    reasons: recommendation.reasoning,
    expected_impact: {
      fuel_saving_percent: recommendation.fuelSavingPercent,
      critical_load_protection_percent: recommendation.criticalLoadProtectionPercent
    }
  });
}
