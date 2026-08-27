import type { AutomationDecision, DeviceConfig } from "@/types/live";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    decision?: AutomationDecision;
    deviceConfig?: DeviceConfig;
  };

  if (!body.decision || !body.deviceConfig) {
    return Response.json({ error: "decision and deviceConfig are required" }, { status: 400 });
  }

  const providerStatus = body.deviceConfig.hardwareProvider === "demo" ? "simulated" : "queued";

  return Response.json({
    ok: true,
    providerStatus,
    sentAt: new Date().toISOString(),
    message:
      body.deviceConfig.hardwareProvider === "demo"
        ? "Command simulated successfully. Add a real gateway provider and endpoint to actuate physical devices."
        : "Command accepted for configured gateway dispatch.",
    commandPayload: body.decision.commandPayload
  });
}
