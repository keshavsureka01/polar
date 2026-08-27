import { evaluateAutomation } from "@/lib/automation";
import { AlertRule, DeviceConfig, LiveWeather } from "@/types/live";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    weather?: LiveWeather;
    alertRules?: AlertRule[];
    deviceConfig?: DeviceConfig;
  };

  if (!body.weather || !body.alertRules || !body.deviceConfig) {
    return Response.json({ error: "weather, alertRules, and deviceConfig are required" }, { status: 400 });
  }

  return Response.json(evaluateAutomation(body.weather, body.alertRules, body.deviceConfig));
}
