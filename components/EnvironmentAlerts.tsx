import { AlertTriangle, CheckCircle2, Info, ShieldAlert, SunMedium, Thermometer, Wind } from "lucide-react";
import { StationData, SystemAlert } from "@/types/station";

interface EnvironmentAlertsProps {
  data: StationData;
}

export function EnvironmentAlerts({ data }: EnvironmentAlertsProps) {
  const { environment, alerts } = data;

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-lg border border-slate-800 bg-[#111827] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
        <h2 className="mb-4 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          <Thermometer className="h-4 w-4 text-cyan-300" aria-hidden="true" />
          Current Weather Conditions
        </h2>
        <div className="mb-5 flex flex-wrap items-baseline gap-4">
          <div className="font-mono text-4xl font-extrabold text-slate-100">{environment.temperatureC} deg C</div>
          <div className="rounded border border-amber-800/60 bg-amber-950/40 px-2.5 py-1 font-mono text-xs font-semibold text-amber-300">
            {environment.weatherStatus}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3 font-mono text-xs">
          <TelemetryTile
            icon={<Wind className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />}
            label="Wind Speed"
            value={`${(environment.windSpeedMs * 3.6).toFixed(1)} km/h`}
          />
          <TelemetryTile
            icon={<SunMedium className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />}
            label="Solar Irradiance"
            value={`${environment.solarIrradianceWm2} W/m2`}
          />
        </div>
      </div>

      <div className="flex flex-col rounded-lg border border-slate-800 bg-[#111827] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)] lg:col-span-2">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            <AlertTriangle className="h-4 w-4 text-amber-300" aria-hidden="true" />
            System Telemetry Alerts
          </h2>
          <span className="rounded border border-slate-800 bg-slate-950/60 px-2 py-0.5 font-mono text-xs text-slate-400">
            {alerts.length} Active Notice{alerts.length > 1 ? "s" : ""}
          </span>
        </div>
        <div className="max-h-36 flex-1 space-y-2.5 overflow-y-auto pr-1">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center justify-between gap-3 rounded border p-2.5 font-mono text-xs ${getAlertStyle(alert.severity)}`}
            >
              <div className="flex items-center gap-2.5">
                {getAlertIcon(alert.severity)}
                <span>{alert.message}</span>
              </div>
              <span className="shrink-0 text-[10px] opacity-75">{alert.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TelemetryTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/45 p-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-slate-400">
        {icon}
        {label}
      </div>
      <div className="font-bold text-slate-200">{value}</div>
    </div>
  );
}

function getAlertIcon(severity: SystemAlert["severity"]) {
  switch (severity) {
    case "critical":
      return <ShieldAlert className="h-4 w-4 shrink-0 text-red-300" aria-hidden="true" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />;
    case "success":
      return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />;
    default:
      return <Info className="h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />;
  }
}

function getAlertStyle(severity: SystemAlert["severity"]) {
  switch (severity) {
    case "critical":
      return "border-red-900/60 bg-red-950/30 text-red-200";
    case "warning":
      return "border-amber-900/60 bg-amber-950/30 text-amber-200";
    case "success":
      return "border-emerald-900/60 bg-emerald-950/30 text-emerald-200";
    default:
      return "border-cyan-900/60 bg-cyan-950/30 text-cyan-200";
  }
}
