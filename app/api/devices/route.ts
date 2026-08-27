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

  const sentAt = new Date().toISOString();
  if (body.deviceConfig.hardwareProvider === "demo") {
    return Response.json({
      ok: true,
      providerStatus: "simulated",
      sentAt,
      message: "Command simulated successfully. Configure a secure HTTP gateway to actuate physical devices.",
      commandPayload: body.decision.commandPayload
    });
  }

  const endpoint = validateGatewayEndpoint(body.deviceConfig.endpointUrl);
  if (!endpoint.ok) {
    return Response.json({ error: endpoint.error }, { status: 400 });
  }

  try {
    const gatewayResponse = await fetch(endpoint.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: body.deviceConfig.hardwareProvider,
        sentAt,
        commands: body.decision.commandPayload.commands
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(6000)
    });

    if (!gatewayResponse.ok) {
      return Response.json(
        { error: `Configured gateway rejected the command with status ${gatewayResponse.status}` },
        { status: 502 }
      );
    }

    return Response.json({
      ok: true,
      providerStatus: "sent",
      sentAt,
      message: `Command delivered to the ${body.deviceConfig.hardwareProvider.toUpperCase()} HTTP gateway.`,
      commandPayload: body.decision.commandPayload
    });
  } catch {
    return Response.json({ error: "Configured gateway could not be reached" }, { status: 502 });
  }
}

function validateGatewayEndpoint(endpointUrl: string): { ok: true; url: URL } | { ok: false; error: string } {
  if (!endpointUrl.trim()) {
    return { ok: false, error: "A gateway endpoint is required for non-demo providers" };
  }

  try {
    const url = new URL(endpointUrl);
    const localDevelopment = process.env.NODE_ENV === "development" && ["localhost", "127.0.0.1"].includes(url.hostname);
    if (url.protocol !== "https:" && !(localDevelopment && url.protocol === "http:")) {
      return { ok: false, error: "Gateway endpoints must use HTTPS" };
    }
    if (isPrivateHost(url.hostname) && !localDevelopment) {
      return { ok: false, error: "Private-network gateway addresses are not reachable from the hosted control plane" };
    }
    return { ok: true, url };
  } catch {
    return { ok: false, error: "Gateway endpoint must be a valid URL" };
  }
}

function isPrivateHost(hostname: string) {
  return /^(localhost|127\.|10\.|192\.168\.|169\.254\.|::1$|fc|fd)/i.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    hostname.endsWith(".local");
}
